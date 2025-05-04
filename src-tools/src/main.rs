mod scan;

use crate::scan::do_scan;
use clap::{Parser, Subcommand};

#[derive(Parser, Debug)]
#[command(name = "docdb-cli")]
#[command(about = "DocDB 的命令行工具", version = "1.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// 扫描目录下的文件
    Scan {
        /// 要扫描的目录路径
        #[arg(short, long)]
        dir: String,

        /// map 文件的路径
        #[arg(short, long)]
        map: String,

        /// 选出来的文件移动到哪里
        #[arg(short, long)]
        output: String,
    },
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Commands::Scan { dir, map, output } => do_scan(dir, map, output),
    }
}
