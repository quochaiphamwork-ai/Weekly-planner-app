param(
  [Parameter(Mandatory = $true)]
  [string]$WindowHandle
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class WallpaperHost {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$progman = [WallpaperHost]::FindWindow("Progman", $null)
$result = [IntPtr]::Zero
[WallpaperHost]::SendMessageTimeout($progman, 0x052C, [IntPtr]::Zero, [IntPtr]::Zero, 0, 1000, [ref]$result) | Out-Null

$workerW = [IntPtr]::Zero
[WallpaperHost]::EnumWindows({
    param($topHandle, $topParam)

    $shellView = [WallpaperHost]::FindWindowEx($topHandle, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
    if ($shellView -ne [IntPtr]::Zero) {
        $script:workerW = [WallpaperHost]::FindWindowEx([IntPtr]::Zero, $topHandle, "WorkerW", $null)
    }

    return $true
}, [IntPtr]::Zero) | Out-Null

if ($workerW -eq [IntPtr]::Zero) {
  $workerW = $progman
}

$targetHandle = [IntPtr]::new([Int64]::Parse($WindowHandle))
[WallpaperHost]::SetParent($targetHandle, $workerW) | Out-Null
[WallpaperHost]::ShowWindow($targetHandle, 5) | Out-Null
