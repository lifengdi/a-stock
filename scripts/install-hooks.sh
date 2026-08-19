#!/usr/bin/env bash
# 安装 git pre-commit 钩子：每次 commit 前自动重建 reports.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
# auto-generated: rebuild reports.json before commit
set -e
ROOT="$(git rev-parse --show-toplevel)"
if command -v node >/dev/null 2>&1; then
  node "$ROOT/scripts/build-index.mjs"
  git add "$ROOT/reports.json"
else
  echo "[pre-commit] 未找到 node，跳过 reports.json 重建" >&2
fi
EOF

chmod +x "$HOOK"
echo "[install-hooks] pre-commit 钩子已安装: $HOOK"
