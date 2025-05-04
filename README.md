# 开发指南

首先需编译 pdf 处理工具。这个工具是 nodejs 写的（因为 rust 不方便处理 pdf），DocDB 在需要的时候会以进程通信的方式调用这个工具。

在 src-pdf 目录下：

```bash
# 安装所需依赖包
yarn install
# 安装 ts 工具
npm install -g typescript
# 将 ts 编译为 js
tsc
# 将 nodejs 程序打包为二进制
# 注意 nodejs 版本不能太低。经测试 18 肯定不行，22 可以
yarn pkg dist/index.js --output app
```

打包后在 src-pdf 目录下会产生一个 app.exe。在项目根目录下创建 bin 目录，将 app.exe 重命名为 pdf.exe 并移动到 bin 目录中。

然后建立 mysql 数据库，需要一个 tb_document 的表，其建立的 sql 语句如下:

```sql
create table tb_document
(
    id         int auto_increment
        primary key,
    md5        varchar(255)            not null,
    name       varchar(255)            not null,
    identifier varchar(255) default '' null,
    page       int                     not null,
    answer     tinyint(1)              not null,
    type       varchar(255)            not null,
    year       int          default -1 null,
    year_type  varchar(255) default '' null,
    filter     text                    not null,
    tags       text                    not null
);

```

然后在 src-server 目录下，有个 config.toml 文件，在里面填好数据库的连接信息。

我们提供一个数据集，包含 1000 份试卷，在 src-server 目录下再新建一个 data 目录，把数据集解压到该目录（即使你不弄数据的话，你也要创建好 data 目录，data 目录下创建一个 files 目录）。

然后执行 src-server 的 bin 中的 import_data.rs ，其目的是将 src/data/data.json 的数据导入到 mysql 数据库。

这些都搞完就可以启动 src-server 了。

然后在项目根目录下执行：

```bash
# 安装前端依赖
yarn install
# 启动 vite
npm run dev
```

然后启动 src-tauri，就大功告成了。
