use regex::Regex;
use src_shared::utils::file::compute_md5;
use std::collections::HashMap;
use std::fs;
use std::fs::create_dir_all;
use walkdir::WalkDir;

const FILTER_KEYWORDS: [&str; 66] = [
    "实验",
    "报告",
    "申请",
    "马院",
    "作业",
    "论文",
    "答辩",
    "课程设计",
    "实习",
    "总结",
    "四级",
    "六级",
    "考研",
    "转专业",
    "简历",
    "高中",
    "高考",
    "小学",
    "小升初",
    "初中",
    "中考",
    "就业",
    "表",
    "面试",
    "毕业",
    "章",
    "推荐",
    "解释",
    "合同",
    "报名",
    "笔记",
    "背诵",
    "任务",
    "形策",
    "专题",
    "政策",
    "大纲",
    "一辩",
    "二辩",
    "三辩",
    "四辩",
    "译文",
    "(?i)pre",
    "(?i)ccf",
    "(?i)csp",
    "(?i)py",
    "(?i)python",
    "小组",
    "知识点",
    "高一",
    "高二",
    "高三",
    "初一",
    "初二",
    "初三",
    "模板",
    "证明",
    "证书",
    "请假",
    "证件",
    "岳麓",
    "志愿",
    "党",
    "大学生",
    "体育",
    "团队",
];

pub fn do_scan(dir: String, map_path: String, output: String) {
    let mut map: HashMap<String, String> =
        serde_json::from_str(fs::read_to_string(map_path.as_str()).unwrap().as_str()).unwrap();
    create_dir_all(output.clone()).unwrap();
    for entry in WalkDir::new(dir)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| {
            if !e.file_type().is_file() {
                return false;
            }
            for keyword in FILTER_KEYWORDS {
                let re = Regex::new(keyword).unwrap();
                if re.is_match(&e.file_name().to_string_lossy()) {
                    return false;
                }
            }
            true
        })
    {
        let md5 = compute_md5(entry.path()).unwrap();
        if let Some(prev) = map.get(md5.as_str()) {
            println!(
                "The file already exists:\n{}\n{}",
                entry.path().to_str().unwrap(),
                prev
            );
        } else {
            fs::copy(
                entry.path(),
                format!("{}/{}", output, entry.file_name().to_string_lossy()),
            )
            .unwrap();
            map.insert(md5, entry.file_name().to_string_lossy().parse().unwrap());
        }
    }
    fs::write(map_path, serde_json::to_string(&map).unwrap()).unwrap();
}
