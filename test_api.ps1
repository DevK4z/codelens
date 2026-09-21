$testPayload = @{
    language = "cpp"
    stdin = "7`n1 3 5 7 9 11 13`n7`n"
    code = @"
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[10];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    int target;
    cin >> target;
    int left = 0, right = n - 1;
    int result = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;
            break;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    cout << result << endl;
    return 0;
}
"@
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/execute" -Method Post -Body $testPayload -ContentType "application/json"

Write-Host "=== API RESPONSE ==="
Write-Host "Success: $($response.success)"
Write-Host "Step count: $($response.stepCount)"
Write-Host "Stdout: $($response.stdout)"
Write-Host "Execution time: $($response.executionTimeMs) ms"
Write-Host "Sandbox warning: $($response.sandboxWarning)"

$firstStep = $response.trace[0]
Write-Host "Step 0: event=$($firstStep.event), line=$($firstStep.line)"

$lastStep = $response.trace[$response.trace.Count - 1]
Write-Host "Last Step: event=$($lastStep.event), line=$($lastStep.line), stdout=$($lastStep.stdout)"

$compareSteps = $response.trace | Where-Object { $_.compareInfo -ne $null }
Write-Host "Number of compare steps: $($compareSteps.Count)"
if ($compareSteps.Count -gt 0) {
    Write-Host "Sample compare: $($compareSteps[0].compareInfo | ConvertTo-Json -Compress)"
}

