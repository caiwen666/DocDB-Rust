use crate::config::{CWD, DATABASE};
use anyhow::Result;
use std::fmt::format;
use std::fs;
use std::io::Write;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};

#[test]
fn test_parse_pdf() -> Result<()> {
    let mut cwd = CWD.clone();
    cwd.push("data");
    cwd.push("files");
    let mut input = String::from("PARSE\n");
    let mut expected = String::new();
    let database = DATABASE.read().unwrap();
    for (md5, doc) in &database.data {
        let mut target = cwd.clone();
        target.push(format!("{}.pdf", md5));
        input.push_str(format!("{}\n", target.as_path().display()).as_str());
        expected.push_str(format!("{}\n", doc.info.page).as_str());
    }
    input.push_str("END");
    {
        let mut input_file = CWD.clone();
        input_file.push("test.in");
        let mut file = fs::File::create(input_file)?;
        file.write_all(input.as_bytes())?;
    }
    let mut pdf_app = CWD.clone();
    pdf_app.push("bin");
    pdf_app.push("app.exe");
    let mut child = Command::new(pdf_app)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
    let mut stdin = child.stdin.take().unwrap();
    writeln!(stdin, "{}", input)?;
    drop(stdin);
    let exit_status = child.wait()?;
    assert!(exit_status.success());
    let stdout = child.stdout.as_mut().unwrap();
    let reader = BufReader::new(stdout);
    let mut output = String::new();
    for line in reader.lines() {
        output.push_str(format!("{}\n", line?).as_str());
    }
    assert_eq!(output, expected);
    Ok(())
}
