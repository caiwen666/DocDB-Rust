use crate::types::document::{Document, DocumentDate, DocumentType};

pub struct DocumentNameFormatter<'a> {
    doc: &'a Document,
    show_id: bool,
    show_md5: bool,
    show_year: bool,
    show_tags: bool,
    show_filter: bool,
    show_answer: bool,
    show_identifier: bool,
}

impl<'a> DocumentNameFormatter<'a> {
    pub fn new(doc: &'a Document) -> Self {
        Self {
            doc,
            show_id: false,
            show_md5: false,
            show_year: false,
            show_tags: false,
            show_filter: false,
            show_answer: false,
            show_identifier: false,
        }
    }

    pub fn show_id(mut self, show: bool) -> Self {
        self.show_id = show;
        self
    }

    pub fn show_md5(mut self, show: bool) -> Self {
        self.show_md5 = show;
        self
    }

    pub fn show_year(mut self, show: bool) -> Self {
        self.show_year = show;
        self
    }

    pub fn show_tags(mut self, show: bool) -> Self {
        self.show_tags = show;
        self
    }

    pub fn show_filter(mut self, show: bool) -> Self {
        self.show_filter = show;
        self
    }

    pub fn show_answer(mut self, show: bool) -> Self {
        self.show_answer = show;
        self
    }

    pub fn show_identifier(mut self, show: bool) -> Self {
        self.show_identifier = show;
        self
    }

    pub fn show_all(mut self) -> Self {
        self.show_id = true;
        self.show_md5 = true;
        self.show_year = true;
        self.show_tags = true;
        self.show_filter = true;
        self.show_answer = true;
        self.show_identifier = true;
        self
    }

    pub fn format(&self) -> String {
        let mut res = String::new();
        if self.show_id {
            res.push_str(format!("[{}]", self.doc.id).as_str());
        }
        if self.show_year {
            match self.doc.info.date {
                None => res.push_str("未知年份"),
                Some(DocumentDate::Year(year)) => res.push_str(format!("{}年", year).as_str()),
                Some(DocumentDate::Grade(grade)) => res.push_str(format!("{}级", grade).as_str()),
            }
        }
        res.push_str(self.doc.info.name.as_str());
        match self.doc.info.typ {
            DocumentType::MidExam => res.push_str("期中"),
            DocumentType::FinalExam => res.push_str("期末"),
            _ => (),
        }
        if self.show_answer {
            if self.doc.info.answer {
                res.push_str("试卷及答案");
            } else {
                res.push_str("试卷");
            }
        }
        if self.show_identifier {
            if let Some(identifier) = &self.doc.info.identifier {
                res.push_str(format!("-{}", identifier).as_str());
            }
        }
        if self.show_filter {
            for filter in self.doc.info.filter.iter() {
                res.push_str(format!("-{}", filter).as_str())
            }
        }
        if self.show_tags {
            for tag in self.doc.info.tags.iter() {
                res.push_str(format!("-{}", tag).as_str())
            }
        }
        if self.show_md5 {
            res.push_str(format!("-{}", self.doc.md5).as_str());
        }
        res
    }
}
