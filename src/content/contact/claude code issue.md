SF Pro isn't web-licensable, so I used a system stack (-apple-system first).
   It renders as real SF Pro on Apple devices



使用worktree时，修改时不要串worktree，你在哪个worktree开发的，就用哪个修改。

使用worktree之前，先提交到本地。

你只负责 src/components/Footer.astro。不要修改 Header、Layout、
Main Content 或任何其他文件。先展示你的计划，等我批准再写代码。



# Claude Code Worktree 使用教程与注意事项

## 一、Worktree 是什么

Git worktree 允许你在**同一个仓库**下创建多个独立的工作目录，每个目录检出不同的分支，共享同一个 `.git` 对象库。在 Claude Code 的语境下，它的价值在于**文件级隔离**：每个会话在自己的目录里编辑文件，不会干扰其他会话的工作。

传统方式同时跑多个 Claude 实例，会遇到三类冲突：写入冲突（后写的覆盖前写的）、状态干扰（一个会话的测试依赖被另一个破坏）、不可区分（半成品修改混在一起）。Worktree 解决的就是这些问题。

---

## 二、基本使用

### 2.1 创建并启动 worktree 会话

使用 `--worktree`（或 `-w`）标志：

```bash
claude --worktree feature-auth
```

默认行为：
- Worktree 创建在 `.claude/worktrees/<名称>/` 下
- 分支命名为 `worktree-<名称>`
- 从仓库默认分支（通常是 `main`）的干净状态开始

省略名称时，Claude 会自动生成一个名字（如 `bright-running-fox`）。

### 2.2 手动管理 worktree

当你需要检出**特定已有分支**或将 worktree 放在仓库外部时，直接用 git 命令：

```bash
# 创建新分支的 worktree
git worktree add ../project-feature-a -b feature-a

# 从已有分支创建 worktree
git worktree add ../project-bugfix fix-issue-456

# 进入并启动 Claude
cd ../project-feature-a
claude

# 列出所有 worktree
git worktree list

# 删除 worktree
git worktree remove ../project-feature-a
```

### 2.3 在会话中途切换 worktree

也可以在当前会话中让 Claude 进入 worktree，使用 `EnterWorktree` 工具。进入非 `.claude/worktrees/` 下的路径时，Claude 会**先请求批准**，因为这会改变会话的工作目录和写入权限。

---

## 三、恢复 worktree 会话

Worktree 会话退出后，有两种恢复方式：

### 3.1 按名称恢复

```bash
claude --resume <worktree名称>
```

名称解析会**自动搜索当前仓库及其所有 worktree**。

### 3.2 使用选择器

运行 `claude --resume`（不带参数），然后在选择器中按 **`Ctrl+W`** 将范围扩展到**该仓库的所有 worktree**。

### 3.3 恢复时的关键规则

Claude Code 恢复 worktree 会话前会**验证该目录仍然是独立的检出**。以下情况会导致恢复失败：
- Worktree 的 `.git` 元数据指向主检出
- 目录已被删除

如果 worktree 目录不存在了，Claude 会在**你启动恢复的目录**中恢复会话，并告知你 worktree 已丢失。

**重要**：从主检出目录或仓库内其他目录启动恢复，Claude 才能正确重新进入 `.claude/worktrees/` 下的 worktree。从 worktree 内部启动恢复可能被拒绝。

---

## 四、清理机制

### 4.1 交互式会话退出时

退出 worktree 会话时，Claude 会检查是否有**未保存的工作**：

| 情况                                  | 行为                             |
| ------------------------------------- | -------------------------------- |
| Worktree 干净（无修改、无未推送提交） | 自动删除 worktree 和分支         |
| 有未保存的工作                        | 询问你保留还是删除               |
| 保留                                  | 目录和分支留在磁盘上，之后可恢复 |
| 删除                                  | 删除目录、分支及所有工作         |

### 4.2 后台会话与子代理的 worktree

Claude Code 会运行**定期清理**，移除超过 `cleanupPeriodDays` 设置的后台会话和子代理 worktree。以下情况**不会被清理**：
- Worktree 仍有未保存的工作（修改的文件、未跟踪文件、未推送提交）
- 你通过 `--worktree` 启动的会话未转入后台
- 你自己用 `git worktree add` 创建的 worktree

---

## 五、配置选项

### 5.1 选择基础分支

默认从**远程默认分支**（通常是 `origin/main`）创建，保证干净起点。如需从当前本地 HEAD 分支（包含未推送提交），设置：

```json
{
  "worktree": {
    "baseRef": "head"
  }
}
```

`"fresh"`（默认）：从远程默认分支创建。
`"head"`：从当前本地 HEAD 创建，适合需要基于进行中工作隔离子代理的场景。

### 5.2 复制 gitignore 的文件

Worktree 默认只检出**已跟踪文件**。`.env`、本地配置等被 gitignore 的文件不会自动出现。使用 `.worktreeinclude` 指定需要复制到 worktree 的文件。

### 5.3 子代理隔离

在子代理定义中永久启用 worktree 隔离：

```yaml
---
name: refactorer
description: Applies mechanical refactors across many files
isolation: worktree
---
```

每个子代理获得临时 worktree，无改动时自动清理。

---

## 六、注意事项与常见问题

### 6.1 不适合并行的情况

以下场景**不要**并行使用 worktree：
- 多个任务修改**同一个文件**（如共享的工具函数、配置）
- 同时更新**依赖文件**（`package.json`、`pnpm-lock.yaml`）
- 同时修改**数据库迁移文件**
- 同时编辑**同一个 `.env` 文件**

Node.js 项目的特殊问题：`node_modules` 可能在多个 worktree 间共享，同时执行 `npm install` / `yarn install` 会导致锁文件冲突。

### 6.2 Symlink 限制

Claude Code **拒绝**在 `.claude`、`.claude/worktrees` 或 worktree 目录本身是 symlink 时创建 worktree。如果你用 symlink 管理这些路径，需要先移除。

### 6.3 Git LFS 问题

如果使用 `git lfs install --local`，worktree 中会得到 **LFS 指针文件**而非真实文件，因为 Claude Code 会跳过仓库自身的 filter driver。解决方式：在 worktree 内运行 `git lfs pull`。

### 6.4 权限提示的存储位置

在 worktree 会话中批准 Bash 命令权限（“Yes, and don‘t ask again”）后，规则保存到**主检出的 `.claude/settings.local.json`**，因此对主检出和其他 worktree 都生效，且不会随 worktree 删除而丢失。

### 6.5 Worktree 锁定

当代理或后台会话运行时，Claude 会对其 worktree 持有 **git worktree lock**，防止并发清理误删。会话进程退出后，后续清理会释放锁。你自己用 `git worktree lock` 设置的锁**不会被释放**。



### 6.6 合并策略（详细步骤与命令）

### 前提：理解 Worktree 的锁定机制

Worktree 会**锁定其检出的分支**，你无法删除一个正在被 worktree 检出的分支。这是合并策略需要特殊处理的核心原因——不能像普通分支那样直接合并后删除。

两种可行的顺序：

**方案 A：先移除 worktree，再合并（推荐）** — 最简单直接，避免锁定冲突

**方案 B：先合并，再清理** — 适合 PR 流程，合并时不带 `--delete-branch`，合并后再手动清理 worktree 和分支


### 方案 A：先移除 Worktree，再合并（推荐）

假设你有两个 worktree 分支：`worktree-header-dev` 和 `worktree-footer-dev`。

#### 第 1 步：在各自的 worktree 中完成并提交

```bash
# 在 header worktree 目录中
cd .claude/worktrees/header-dev
git add .
git commit -m "feat: complete header navigation"

# 在 footer worktree 目录中
cd .claude/worktrees/footer-dev
git add .
git commit -m "feat: complete footer section"
```

确保两个 worktree 都是干净状态（无未提交更改），否则 `git worktree remove` 会失败。

#### 第 2 步：回到主仓库，移除第一个 worktree

```bash
# 回到主仓库目录（不在任何 worktree 内）
cd /path/to/main-repo

# 移除 header worktree
git worktree remove .claude/worktrees/header-dev
```

如果提示“有未提交更改”，但你确认不需要保留，可以用 `--force`：

```bash
git worktree remove --force .claude/worktrees/header-dev
```

**注意**：`--force` 会不可恢复地丢弃未提交工作。

#### 第 3 步：在主仓库合并第一个分支

```bash
# 确保主仓库在 main 分支且是最新的
git checkout main
git pull --rebase origin main

# 合并 header 分支
git merge worktree-header-dev -m "merge: header component"

# 推送
git push origin main
```

如果你偏好整洁历史，可以用 squash merge：

```bash
git merge --squash worktree-header-dev
git commit -m "feat: header component"
git push origin main
```



#### 第 4 步：移除第二个 worktree 并合并

```bash
# 移除 footer worktree
git worktree remove .claude/worktrees/footer-dev

# 合并 footer 分支
git merge worktree-footer-dev -m "merge: footer component"

# 推送
git push origin main
```


### 方案 B：先合并，再清理（PR 流程）

如果你走 GitHub PR 流程，合并时**不要**使用 `--delete-branch`，因为分支被 worktree 锁定，删除会失败。

#### 第 1 步：从 worktree 中推送分支

```bash
cd .claude/worktrees/header-dev
git push -u origin worktree-header-dev
```

#### 第 2 步：创建并合并 PR

```bash
# 用 gh CLI 创建 PR
gh pr create --head worktree-header-dev --base main --title "Header component"

# 合并时不要加 --delete-branch
gh pr merge --squash --delete-branch=false
```

#### 第 3 步：回到主仓库，更新 main 并清理 worktree

```bash
cd /path/to/main-repo
git checkout main
git pull origin main

# 移除已合并的 worktree
git worktree remove .claude/worktrees/header-dev

# 删除本地分支
git branch -D worktree-header-dev
```




### 冲突处理

如果两个 worktree 修改了同一个文件（如 `Layout.astro`），合并第二个时会产生冲突。

```bash
# 合并时出现冲突
git merge worktree-footer-dev

# 查看冲突文件
git status

# 手动编辑冲突文件，保留正确内容后：
git add <冲突文件>
git commit -m "merge: footer, resolve Layout conflict"

# 推送
git push origin main
```

**预防优于修复**：如果两个 worktree 需要编辑同一个文件，**不要并行**——改为串行开发（等一个合并后再开另一个 worktree）。


### 关于 Rebase（可选，进阶）

如果你想让合并历史更整洁（线性而非分叉），可以在合并前对 worktree 分支执行 rebase：

```bash
# 在 worktree 中，先 rebase 到最新 main
cd .claude/worktrees/header-dev
git fetch origin
git rebase origin/main

# 如果 rebase 后有冲突，解决后 git rebase --continue

# 回到主仓库，快进合并
cd /path/to/main-repo
git checkout main
git merge worktree-header-dev   # 这会 fast-forward
```

**关键警告**：**永远不要 rebase 已经推送到远程、且其他人可能已经拉取过的提交**。如果分支只有你一个人用，rebase 是安全的；如果有协作，用 merge。


### 清理验证

合并完成后，验证清理是否彻底：

```bash
# 列出所有 worktree，确认已合并的已移除
git worktree list

# 清理失效的 worktree 记录（如果你手动删过目录）
git worktree prune -v

# 清理远程已删除的跟踪分支
git fetch --prune
```




### 命令速查

| 步骤          | 命令                                 |
| ------------- | ------------------------------------ |
| 移除 worktree | `git worktree remove <路径>`         |
| 强制移除      | `git worktree remove --force <路径>` |
| 合并分支      | `git merge <分支名>`                 |
| Squash 合并   | `git merge --squash <分支名>`        |
| 删除本地分支  | `git branch -d <分支名>`             |
| 清理失效记录  | `git worktree prune -v`              |
| 列出 worktree | `git worktree list`                  |

---

## 七、实用命令速查

| 目的                       | 命令                                                     |
| -------------------------- | -------------------------------------------------------- |
| 创建并启动 worktree 会话   | `claude --worktree <名称>`                               |
| 手动创建 worktree          | `git worktree add <路径> -b <分支名>`                    |
| 列出所有 worktree          | `git worktree list`                                      |
| 删除 worktree              | `git worktree remove <路径>`                             |
| 清理已删除 worktree 的记录 | `git worktree prune`                                     |
| 解除锁定                   | `git worktree unlock <路径>`                             |
| 强制删除（有未提交更改时） | `git worktree remove --force <路径>`                     |
| 恢复 worktree 会话         | `claude --resume <名称>` 或 `claude --resume` + `Ctrl+W` |



使用worktree时，不能共享同样的layout或者component。
You can develop books and tutorials pages in parallel using worktrees, but first you need to answer one key question: will these two pages share the same layout or components (like header, footer, sidebar)?

If they are completely independent pages with no shared UI components modified, parallel worktrees are safe and efficient. If they share a layout, parallel development will cause merge conflicts.


规范好figma layer的命名，Home，Main Content, Hero Content,
Footer, Banner, Book Card. Book Body. Book Cover. Book Title

注意要在ClAUDE.md中规定，不能写死static，需要动态渲染后台上传

使用figma在固定宽度中，设置多个卡片，水平分布，靠左对齐时，flow使用grid

拷问ai
github:xiaolai/cc-suite