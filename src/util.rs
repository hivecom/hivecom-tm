use askama_escape::Escaper;

use crate::parse::{Fragment, Tag::*};
use std::collections::VecDeque;

pub fn sanitize_map_name(name: &str) -> String {
    crate::parse::map_name_string(name).expect("Parser supports all valid map names")
}

pub fn styling_to_html(name: &str) -> String {
    let reset_all = |name_html: &mut String, stack: &mut Vec<crate::parse::Tag>| {
        while let Some(frag) = stack.pop() {
            match frag {
                Bold | Italic | Wide | Shadowed | Narrow | Color(_, _, _) => {
                    name_html.push_str("</span>");
                }
                Normal | DefaultColor | ResetAll | Capitals => (),
            }
        }
    };

    let mut name_html = String::new();
    let mut stack = Vec::new();
    let mut capitals = false;

    let mut frags = VecDeque::from(crate::parse::map_name(name).unwrap());
    while let Some(frag) = frags.pop_front() {
        match frag {
            Fragment::Text(t) => {
                if capitals {
                    askama_escape::Html
                        .write_escaped(&mut name_html, &t.to_uppercase())
                        .unwrap();
                } else {
                    askama_escape::Html
                        .write_escaped(&mut name_html, t)
                        .unwrap();
                }
            }
            Fragment::Tag(tag) => match tag {
                Bold | Italic | Shadowed | Wide | Narrow | Color(_, _, _) => {
                    stack.push(tag);
                    name_html = format!("{}{}", name_html, tag.as_html_tag());
                }
                Normal => {
                    while stack.iter().any(|t| matches!(t, Wide | Narrow)) {
                        name_html = format!("{}{}", name_html, "</span>");

                        let tag = stack.pop().unwrap();
                        if !matches!(tag, Wide | Narrow) {
                            frags.push_front(Fragment::Tag(tag));
                        }
                    }
                }
                DefaultColor => {
                    while stack.iter().any(|t| matches!(t, Color(_, _, _))) {
                        name_html = format!("{}{}", name_html, "</span>");

                        let tag = stack.pop().unwrap();
                        if !matches!(tag, Color(_, _, _)) {
                            frags.push_front(Fragment::Tag(tag));
                        }
                    }
                }
                ResetAll => {
                    reset_all(&mut name_html, &mut stack);
                    capitals = false;
                }
                Capitals => {
                    capitals = true;
                }
            },
        }
    }

    reset_all(&mut name_html, &mut stack);

    name_html
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fruzzy() {
        let input = "$w$f0fF$f1fr$f2fu$f4fz$f6fz$f8fy";
        let actual = styling_to_html(input);

        assert_eq!(
            "<span class=\"wide\">\
            <span style=\"color: rgb(255, 0, 255);\">F\
            <span style=\"color: rgb(255, 17, 255);\">r\
            <span style=\"color: rgb(255, 34, 255);\">u\
            <span style=\"color: rgb(255, 68, 255);\">z\
            <span style=\"color: rgb(255, 102, 255);\">z\
            <span style=\"color: rgb(255, 136, 255);\">y\
            </span></span></span></span></span></span></span>",
            actual
        );
    }

    #[test]
    fn default_color() {
        let input = "$fff$ocolored$gbold";
        let actual = styling_to_html(input);

        assert_eq!(
            "<span style=\"color: rgb(255, 255, 255);\">\
            <span class=\"bold\">colored</span></span>\
            <span class=\"bold\">bold</span>",
            actual
        );
    }
}
