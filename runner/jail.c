/*
 * codelens-jail <uid> <memory-mb> <workdir> <program> [args...]
 *
 * Isolates one submission where per-run containers are unavailable (Render cannot
 * run Docker-in-Docker). Started as root inside the service container, it:
 *   - applies resource limits that the submission cannot raise again,
 *   - drops to a uid used by this run only, so concurrent runs cannot signal,
 *     ptrace or read each other and RLIMIT_NPROC counts just this run,
 *   - installs a seccomp filter that refuses network sockets and io_uring,
 *   - closes inherited descriptors and executes with a minimal environment, so the
 *     service's secrets never reach the submission.
 * Every step fails closed: if one cannot be applied the submission does not run.
 */
#define _GNU_SOURCE
#include <errno.h>
#include <grp.h>
#include <seccomp.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/resource.h>
#include <sys/socket.h>
#include <unistd.h>

#define UID_MIN 20000
#define UID_MAX 29999

static void die(const char *what) {
  fprintf(stderr, "codelens-jail: %s: %s\n", what, strerror(errno));
  exit(125);
}

static long number(const char *text, long min, long max, const char *what) {
  char *end;
  errno = 0;
  long value = strtol(text, &end, 10);
  if (errno || *end || value < min || value > max) {
    fprintf(stderr, "codelens-jail: invalid %s\n", what);
    exit(125);
  }
  return value;
}

static void limit(int resource, rlim_t value, const char *what) {
  struct rlimit lim = { value, value };
  if (setrlimit(resource, &lim)) die(what);
}

static void become(uid_t uid) {
  if (setgroups(0, NULL)) die("setgroups");
  if (setresgid(uid, uid, uid)) die("setresgid");
  if (setresuid(uid, uid, uid)) die("setresuid");
  if (setuid(0) == 0 || geteuid() == 0) {
    fprintf(stderr, "codelens-jail: privileges were not dropped\n");
    exit(125);
  }
}

/*
 * codelens-jail --kill <uid>: ends every process of a run, including ones that left its process
 * group. Render's containers lack CAP_KILL, so root cannot signal another uid; a process may always
 * signal its own uid, so this becomes the run's uid and sends SIGKILL to everything it can reach.
 * kill(-1) skips the caller and PID 1. It repeats while anything answers, because a process can fork
 * between rounds and zombies answer until tini reaps them.
 */
static int kill_uid(uid_t uid) {
  become(uid);
  for (int round = 0; round < 100; round++) {
    if (kill(-1, SIGKILL) && errno == ESRCH) return 0;
    usleep(10000);
  }
  return 0;
}

int main(int argc, char **argv) {
  if (argc == 3 && !strcmp(argv[1], "--kill")) return kill_uid((uid_t)number(argv[2], UID_MIN, UID_MAX, "uid"));
  if (argc < 5) {
    fprintf(stderr, "usage: codelens-jail <uid> <memory-mb> <workdir> <program> [args...]\n"
                    "       codelens-jail --kill <uid>\n");
    return 125;
  }
  uid_t uid = (uid_t)number(argv[1], UID_MIN, UID_MAX, "uid");
  rlim_t memory = (rlim_t)number(argv[2], 64, 4096, "memory-mb") << 20;
  if (chdir(argv[3])) die("chdir");

  limit(RLIMIT_AS, memory, "RLIMIT_AS");
  limit(RLIMIT_NPROC, 64, "RLIMIT_NPROC");
  limit(RLIMIT_FSIZE, 64ul << 20, "RLIMIT_FSIZE");
  limit(RLIMIT_NOFILE, 64, "RLIMIT_NOFILE");
  limit(RLIMIT_CPU, 60, "RLIMIT_CPU");
  limit(RLIMIT_CORE, 0, "RLIMIT_CORE");

  become(uid);

  if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0)) die("no_new_privs");
  scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
  if (!ctx) die("seccomp_init");
  // Unix sockets stay usable; any address family that can reach a network does not.
  if (seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EACCES), SCMP_SYS(socket), 1, SCMP_A0(SCMP_CMP_NE, AF_UNIX))
      // io_uring can create sockets without the socket syscall.
      || seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(io_uring_setup), 0)
      || seccomp_load(ctx)) {
    errno = errno ? errno : EINVAL;
    die("seccomp");
  }
  seccomp_release(ctx);

  // Nothing the service opened (its listening socket included) may leak into the run.
  for (int fd = 3; fd < 1024; fd++) close(fd);

  char home[4096];
  snprintf(home, sizeof home, "HOME=%s", argv[3]);
  char *env[] = { "PATH=/usr/local/bin:/usr/bin:/bin", "LANG=C.UTF-8", home, NULL };
  execve(argv[4], &argv[4], env);
  die("execve");
}
