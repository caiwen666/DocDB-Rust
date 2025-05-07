#[cfg(test)]
mod test {
    use crate::{
        config::{db, Cwd},
        utils::result::Result,
    };
    use std::{
        fs,
        io::{BufRead, BufReader, Write},
        process::{Command, Stdio},
    };

    #[tokio::test]
    async fn test_parse_pdf() -> Result<()> {
        let mut input = String::from("PARSE\n");
        let mut expected = String::new();
        let database = db().await.read().await;
        for (md5, doc) in &database.data {
            let target = Cwd::from_file().push(format!("{}.pdf", md5)).path();
            input.push_str(format!("{}\n", target.as_path().display()).as_str());
            expected.push_str(format!("{}\n", doc.info.page).as_str());
        }
        input.push_str("END");
        {
            let input_file = Cwd::from_root().push("test.in").path();
            let mut file = fs::File::create(input_file)?;
            file.write_all(input.as_bytes())?;
        }
        let pdf_app = Cwd::from_root().push("bin").push("pdf.exe").path();
        // 下面懒得改异步了
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
}
