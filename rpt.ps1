$Trigger= New-ScheduledTaskTrigger -AtLogon
$User= "NT AUTHORITY\SYSTEM"
$Action= New-ScheduledTaskAction -Execute "%windir%\System32\cmd.exe" -Argument "/c start %WINDIR%\system32\ptrplst.exe"
Register-ScheduledTask -TaskName "WindirSystemDelay_T" -Trigger $Trigger -User $User -Action $Action -RunLevel Highest –Force




