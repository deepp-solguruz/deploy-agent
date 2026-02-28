import json
import os
from services.git_service import git_create_branch_and_commit, git_push, github_create_pr

repo_path = "/home/developer/Documents/deploy-agent"
if not os.path.exists(repo_path):
    print(f"Repo path {repo_path} doesn't exist.")
else:
    branch = "feat/test-pr-debug"
    commit = git_create_branch_and_commit(repo_path, branch, "test commit")
    print("COMMIT:", json.dumps(commit, indent=2))
    
    push = git_push(repo_path, branch)
    print("PUSH:", json.dumps(push, indent=2))
    
    if push["success"]:
        pr = github_create_pr(repo_path, branch, "main", "Test PR", "Test body")
        print("PR:", json.dumps(pr, indent=2))
