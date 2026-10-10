@echo off
cd C:\Users\exdik\Qwen-Workspace\trip-schedule
set NEXT_PUBLIC_SUPABASE_URL=https://tchdcqflcfuhsgqaquzn.supabase.co
set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGRjcWZsY2Z1aHNncWFxdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODM4NDksImV4cCI6MjEwNjk1OTg0OX0.c0Z1ILIISm0zRcY79V8tbjUKY7bzQa17RFBanaAVFnU
C:\nvm4w\nodejs\node.exe ./node_modules/next/dist/bin/next build > build_out.log 2>&1
echo BUILD_COMPLETE > build_status.txt
