export const ALLOWED_INCLUDES = ['iostream', 'vector', 'algorithm', 'string', 'cmath', 'cstdio', 'cstdlib', 'climits', 'cstring', 'stack', 'queue', 'sstream', 'set', 'map'];

// Embedded runtime: keep C++ source readable; String.raw preserves JSON escaping.
export const TRACE_HEADER = String.raw`
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <set>
#include <map>
#include <cmath>
#include <iomanip>
#include <type_traits>
using namespace std;
static int __cl_step_count = 0;
static const int __CL_MAX_STEPS = 10000;
static stringstream __cl_cum_stdout;
static string __cl_escape(const string& s) {
  string r;
  for (unsigned char c : s) {
    switch(c) {
      case '"': r += "\\\""; break;
      case '\\': r += "\\\\"; break;
      case '\n': r += "\\n"; break;
      case '\r': r += "\\r"; break;
      case '\t': r += "\\t"; break;
      default:
        if (c < 32) { char b[7]; snprintf(b, sizeof(b), "\\u%04x", c); r += b; }
        else r += c;
    }
  }
  return r;
}
static string __cl_json(const string& s) { return "\"" + __cl_escape(s) + "\""; }
static string __cl_json(char c) { return __cl_json(string(1, c)); }
static string __cl_json(bool b) { return b ? "true" : "false"; }
template<typename T> static string __cl_json(const T& value) {
  if constexpr (is_floating_point_v<T>) if (!isfinite(value)) return "null";
  stringstream ss; ss << setprecision(17) << value; return ss.str();
}
class __cl_OStreamWrapper {
public:
  template<typename T> __cl_OStreamWrapper& operator<<(const T& value) {
    cout << value; __cl_cum_stdout << value; return *this;
  }
  __cl_OStreamWrapper& operator<<(ostream& (*manip)(ostream&)) {
    cout << manip; __cl_cum_stdout << manip; return *this;
  }
};
static __cl_OStreamWrapper __cl_cout;
struct __cl_CallFrame { string func; int line; string returnValue; vector<pair<string,string>> params; int id; };
static vector<__cl_CallFrame> __cl_stack;
static int __cl_next_frame = 0;
struct __cl_InitState { bool initialized = true; set<int> indices; };
static map<void*, __cl_InitState> __cl_init;
// Lifetime-bound metadata prevents reused addresses and shadowed variables inheriting state.
struct __cl_VarGuard {
  void* ptr; bool existed; __cl_InitState prior;
  __cl_VarGuard(void* p, bool initialized): ptr(p), existed(__cl_init.count(p)), prior(__cl_init[p]) {
    __cl_init[p] = { initialized, {} };
  }
  ~__cl_VarGuard() { if (existed) __cl_init[ptr] = prior; else __cl_init.erase(ptr); }
};
class __cl_StateBuilder {
public:
  int line; string event;
  vector<pair<string,string>> vars;
  vector<string> changed;
  string swapInfo, arrayAccess, compareInfo, detail;
  vector<string> compareAccesses;
  void set_uninit(void* p) { __cl_init[p] = {false, {}}; }
  void set_init(void* p) { __cl_init[p].initialized = true; }
  void set_arr_init(void* p, int i) { __cl_init[p].indices.insert(i); }
  bool is_uninit(void* p) { return __cl_init.count(p) && !__cl_init[p].initialized; }
  void begin(int l, const char* e) { line=l; event=e; vars.clear(); changed.clear(); compareAccesses.clear(); swapInfo.clear(); arrayAccess.clear(); compareInfo.clear(); detail.clear(); }
  template<typename T> void var_value(const char* n, void* p, const T& v) { vars.push_back({n, is_uninit(p) ? "null" : __cl_json(v)}); }
  void var_int(const char* n, void* p, const int& v) { var_value(n,p,v); }
  void var_double(const char* n, void* p, const double& v) { var_value(n,p,v); }
  void var_char(const char* n, void* p, const char& v) { var_value(n,p,v); }
  void var_bool(const char* n, void* p, const bool& v) { var_value(n,p,v); }
  void var_str(const char* n, void* p, const string& v) { var_value(n,p,v); }
  template<typename T> void var_vec(const char* n, void*, const vector<T>& v) {
    string out="["; for(size_t i=0;i<v.size();++i) { if(i) out+=","; out+=__cl_json(static_cast<T>(v[i])); } vars.push_back({n,out+"]"});
  }
  template<typename T> void var_arr(const char* n, void* p, T* a, int size) {
    string out="[";
    for(int i=0;i<size;++i) { if(i) out+=","; out += is_uninit(p) && !__cl_init[p].indices.count(i) ? "null" : __cl_json(a[i]); }
    vars.push_back({n,out+"]"});
  }
  void mark_changed(const char* n) { changed.push_back(n); }
  void set_swap(const char* a, int i, int j) { swapInfo="{\"array\":"+__cl_json(string(a))+",\"index1\":"+to_string(i)+",\"index2\":"+to_string(j)+"}"; }
  template<typename T> void set_access(const char* a, int i, const char* m, const T& v) { arrayAccess="{\"array\":"+__cl_json(string(a))+",\"index\":"+to_string(i)+",\"mode\":"+__cl_json(string(m))+",\"value\":"+__cl_json(v)+"}"; }
  template<typename L, typename R> void set_compare(const char* l, const char* r, const L& lv, const R& rv, const char* op, bool result) {
    compareInfo="{\"left\":"+__cl_json(string(l))+",\"right\":"+__cl_json(string(r))+",\"leftValue\":"+__cl_json(lv)+",\"rightValue\":"+__cl_json(rv)+",\"operator\":"+__cl_json(string(op))+",\"result\":"+__cl_json(result)+"}";
  }
  void set_compare_access(const char* a, int i) { compareAccesses.push_back("{\"array\":"+__cl_json(string(a))+",\"index\":"+to_string(i)+"}"); }
  void set_detail(const string& d) { detail=d; }
  template<typename T> void add_param(const char* n, const T& v) { if(!__cl_stack.empty()) __cl_stack.back().params.push_back({n,__cl_json(v)}); }
  void add_param_str(const char* n, const string& v) { add_param(n,v); }
  template<typename T> void set_return(const T& v) { if(!__cl_stack.empty()) __cl_stack.back().returnValue=__cl_json(v); }
  void emit() {
    string out="{\"step\":"+to_string(__cl_step_count)+",\"line\":"+to_string(line)+",\"event\":"+__cl_json(event)+",\"callStack\":[";
    for(size_t i=0;i<__cl_stack.size();++i) {
      if(i) out+=","; const auto& f=__cl_stack[i];
      out+="{\"func\":"+__cl_json(f.func)+",\"line\":"+to_string(f.line)+",\"id\":"+to_string(f.id)+",\"params\":{";
      for(size_t j=0;j<f.params.size();++j) { if(j) out+=","; out+=__cl_json(f.params[j].first)+":"+f.params[j].second; }
      out+="}"; if(!f.returnValue.empty()) out+=",\"returnValue\":"+f.returnValue; out+="}";
    }
    out+="],\"variables\":{";
    for(size_t i=0;i<vars.size();++i) { if(i) out+=","; out+=__cl_json(vars[i].first)+":"+vars[i].second; }
    out+="},\"changed\":[";
    for(size_t i=0;i<changed.size();++i) { if(i) out+=","; out+=__cl_json(changed[i]); }
    out+="]";
    if(!swapInfo.empty()) out+=",\"swapInfo\":"+swapInfo;
    if(!arrayAccess.empty()) out+=",\"arrayAccess\":"+arrayAccess;
    if(!compareInfo.empty()) out+=",\"compareInfo\":"+compareInfo;
    if(event == "compare") {
      out += ",\"compareAccesses\":[";
      for(size_t i=0;i<compareAccesses.size();++i) { if(i) out+=","; out+=compareAccesses[i]; }
      out += "]";
    }
    if(!detail.empty()) out+=",\"detail\":"+__cl_json(detail);
    out+=",\"stdout\":"+__cl_json(__cl_cum_stdout.str())+"}";
    fprintf(stderr,"%s\n",out.c_str()); fflush(stderr); ++__cl_step_count;
  }
};
static __cl_StateBuilder __cl_sb;
static void __cl_enter(const char* f,int l) { __cl_stack.push_back({f,l,"",{},++__cl_next_frame}); }
static void __cl_leave() { if(!__cl_stack.empty()) __cl_stack.pop_back(); }
static void __cl_begin(int l,const char* e) {
  if(__cl_step_count>=__CL_MAX_STEPS) { fprintf(stderr,"{\"error\":\"STEP_LIMIT\"}\n"); exit(1); }
  __cl_sb.begin(l,e);
}
static void __cl_end() { __cl_sb.emit(); }
`;
