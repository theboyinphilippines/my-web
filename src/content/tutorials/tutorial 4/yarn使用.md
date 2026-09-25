yarn使用

# 解决 `yarn dev` 运行 Astro 时的 `astro:toolbar:internal` 解析错误

## 问题现象

在使用 `yarn dev` 启动 Astro 项目时，出现如下报错：

```
[RESOLVE_ERROR] Could not resolve 'astro:toolbar:internal' in
.yarn/__virtual__/astro-virtual-2ee59e46b2/2/.yarn/berry/cache/astro-npm-7.3.3-6dd6e56ff2-10c0.zip/node_modules/astro/dist/runtime/client/dev-toolbar/entrypoint.js

   ╭─[ .../astro/dist/runtime/client/dev-toolbar/entrypoint.js:1:36 ]
   │
 1 │ import { loadDevToolbarApps } from "astro:toolbar:internal";
   │                                    ────────────┬───────────
   │                                                ╰───────────── astro tried to access astro:toolbar:internal,
   │                                                               but it isn't declared in its dependencies;
   │                                                               this makes the require call ambiguous and unsound.
```

同时可能伴随如下警告：

```
[WARN] [vite] Using Yarn PnP with Vite is discouraged and PnP-specific bugs
will no longer be actively worked on. Please switch to a different nodeLinker
mode or to a different package manager.
```

## 问题原因

这个错误的根本原因是 **Yarn Berry（v2+）的 Plug'n'Play（PnP）模式与 Astro 开发工具栏的虚拟模块解析发生了冲突**。

从报错路径中的 `.yarn/__virtual__/...` 可以判断，项目正在使用 Yarn 的 PnP 链接器。PnP 的严格依赖声明机制，导致 Astro 内部的虚拟模块 `astro:toolbar:internal` 无法被正确解析。

此外，Vite 官方已明确表示 **不再主动修复 PnP 相关的 bug**，继续使用 PnP 会面临持续的兼容性风险。

## 前置准备：安装 Yarn

在开始解决问题之前，请确保已经正确安装了 Yarn。以下提供两种主流安装方式。

### 方式一：通过 Corepack 安装（推荐）

Node.js 16.10+ 版本内置了 **Corepack**，可以方便地管理 Yarn 的版本。

#### 1. 启用 Corepack

```bash
corepack enable
```

#### 2. 准备指定版本的 Yarn

在项目根目录执行（以 Yarn 4 为例）：

```bash
corepack prepare yarn@4.5.0 --activate
```

#### 3. 验证安装

```bash
yarn --version
```

如果输出版本号（如 `4.5.0`），说明安装成功。

### 方式二：通过 npm 全局安装

如果 Corepack 不可用，也可以通过 npm 安装：

```bash
npm install -g yarn
```

安装完成后验证：

```bash
yarn --version
```

### 方式三：通过官方脚本安装（macOS / Linux）

```bash
curl -o- -L https://yarnpkg.com/install.sh | bash
```

安装完成后，重新打开终端或执行 `source ~/.bashrc`（或 `~/.zshrc`），然后验证：

```bash
yarn --version
```

### 在项目中启用 Yarn Berry（v2+）

若项目需要使用 Yarn Berry（PnP 或 node-modules 模式），在项目根目录执行：

```bash
yarn set version berry
```

该命令会在项目中生成 `.yarn/` 目录和 `.yarnrc.yml` 文件。

> **提示**：Astro 项目建议直接使用 Yarn Berry + `node-modules` 链接器，或改用 pnpm，以避免 PnP 带来的兼容性问题。

## 解决方案：切换 Yarn 的链接器模式

将链接器从 `pnp` 切换为 `node-modules`，可以让 Node 以传统的 `node_modules` 方式解析依赖，从而从根本上绕过 PnP 的严格限制。这是 Astro 官方文档和 Vite 团队共同建议的解决办法。

### 操作步骤

#### 1. 修改 `.yarnrc.yml` 文件

打开项目根目录下的 `.yarnrc.yml` 文件，确保其中包含（或修改为）以下内容：

```yaml
nodeLinker: node-modules
```

> 如果该文件不存在，可以在项目根目录手动创建，并写入上述内容。

#### 2. 重新安装依赖

在终端中执行：

```bash
yarn install
```

此步骤会根据新的链接器模式重新生成 `node_modules` 目录。

#### 3. 启动开发服务器

```bash
yarn dev
```

此时 `astro:toolbar:internal` 的解析错误应当消失，开发工具栏也能正常加载。

## 备选方案：更换包管理器

如果希望获得更好的性能和依赖隔离，也可以考虑直接切换到 **pnpm**。pnpm 在磁盘空间利用、安装速度上表现更优，并且与 Vite 和 Astro 的兼容性良好，是目前现代前端项目的推荐选择之一。

切换方式示例：

```bash
# 移除 Yarn 相关锁文件
rm -rf yarn.lock .yarnrc.yml .yarn

# 使用 pnpm 重新安装
pnpm install

# 启动开发服务器
pnpm dev
```

## 总结

| 项目     | 说明                                            |
| -------- | ----------------------------------------------- |
| 问题根源 | Yarn PnP 模式与 Astro 虚拟模块解析冲突          |
| 推荐方案 | 将 `nodeLinker` 切换为 `node-modules`           |
| 关键配置 | `.yarnrc.yml` 中添加 `nodeLinker: node-modules` |
| 生效步骤 | `yarn install` → `yarn dev`                     |
| 备选方案 | 切换到 pnpm 等其他包管理器                      |

通过以上调整，即可解决 `yarn dev` 启动 Astro 时出现的 `astro:toolbar:internal` 解析错误，并消除 Vite 关于 PnP 的警告。