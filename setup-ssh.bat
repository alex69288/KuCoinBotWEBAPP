@echo off
echo Setting up SSH for GitHub...

REM Start ssh-agent if not running
ssh-agent > temp_ssh_agent.bat
call temp_ssh_agent.bat
del temp_ssh_agent.bat

REM Add SSH key
ssh-add "%USERPROFILE%\.ssh\id_ed25519"

echo SSH setup complete!
echo You can now use: git push origin master