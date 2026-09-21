use pest::{error::Error, iterators::Pair, Parser};
use pest_derive::Parser;

use std::borrow::Cow;

#[cfg(debug_assertions)]
const _GRAMMAR: &str = include_str!("map_name.pest");

#[derive(Parser)]
#[grammar = "map_name.pest"]
pub struct MapNameParser;

pub fn map_name(input: &str) -> Result<Vec<Fragment<'_>>, Error<Rule>> {
    let parsed = MapNameParser::parse(Rule::name, input)?
        .next()
        .expect("Pest grammar should always have a top level name");

    Ok(name_from_pest(parsed))
}

pub fn map_name_string(input: &str) -> Result<String, Error<Rule>> {
    let mut result = String::new();
    for frag in map_name(input)? {
        match frag {
            Fragment::Text(txt) => result.push_str(txt),
            Fragment::Tag(_) => (),
        }
    }

    Ok(result)
}

#[derive(Debug, PartialEq, Eq)]
pub enum Fragment<'a> {
    Tag(Tag),
    Text(&'a str),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Tag {
    Bold,
    Italic,
    Shadowed,
    Wide,
    Narrow,
    Normal,
    DefaultColor,
    ResetAll,
    Capitals,
    Color(u8, u8, u8),
}

pub fn name_from_pest(frags: Pair<Rule>) -> Vec<Fragment> {
    let mut result = Vec::new();
    for frag in frags.into_inner() {
        match frag.as_rule() {
            Rule::tag => {
                if let Some(pair) = frag.into_inner().next() {
                    result.push(Fragment::Tag(Tag::from_pest(pair)));
                }
            }
            Rule::text => {
                result.push(Fragment::Text(frag.as_str()));
            }
            _ => unreachable!(),
        }
    }

    result
}

impl Tag {
    fn from_pest(parsed: Pair<Rule>) -> Self {
        match parsed.as_rule() {
            Rule::bold => Tag::Bold,
            Rule::italic => Tag::Italic,
            Rule::shadowed => Tag::Shadowed,
            Rule::wide => Tag::Wide,
            Rule::narrow => Tag::Narrow,
            Rule::normal => Tag::Normal,
            Rule::default_color => Tag::DefaultColor,
            Rule::reset => Tag::ResetAll,
            Rule::capitals => Tag::Capitals,
            Rule::color => Self::color(parsed.as_str()),
            _ => unreachable!(),
        }
    }

    fn color(hex: &str) -> Self {
        let mut chars = hex.chars();
        let (r, g, b) = (chars.next(), chars.next(), chars.next());
        let r = r.unwrap_or('0').to_digit(16).unwrap_or(0) as u8;
        let g = g.unwrap_or('0').to_digit(16).unwrap_or(0) as u8;
        let b = b.unwrap_or('0').to_digit(16).unwrap_or(0) as u8;

        // Copy lower half of the byte into upper half
        Self::Color(r | r << 4, g | g << 4, b | b << 4)
    }

    pub fn as_html_tag(&self) -> Cow<'static, str> {
        use Tag::*;

        match self {
            Bold => Cow::Borrowed("<span class=\"bold\">"),
            Italic => Cow::Borrowed("<span class=\"italic\">"),
            Shadowed => Cow::Borrowed("<span class=\"shadow\">"),
            Wide => Cow::Borrowed("<span class=\"wide\">"),
            Narrow => Cow::Borrowed("<span class=\"narrow\">"),
            Color(r, g, b) => {
                Cow::Owned(format!("<span style=\"color: rgb({}, {}, {});\">", r, g, b))
            }
            Normal | DefaultColor | ResetAll | Capitals => Cow::Borrowed(""),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use Tag::*;

    #[test]
    fn fortuna_atraction() {
        let input = "$w$s$i$a$afa$afgFortuna atra$wction";

        let actual = map_name(input).unwrap();

        let expected = vec![
            Fragment::Tag(Wide),
            Fragment::Tag(Shadowed),
            Fragment::Tag(Italic),
            Fragment::Tag(Color(170, 255, 170)),
            Fragment::Tag(Color(170, 255, 0)),
            Fragment::Text("Fortuna atra"),
            Fragment::Tag(Wide),
            Fragment::Text("ction"),
        ];

        assert_eq!(expected, actual);
    }

    #[test]
    fn fruzzy() {
        let input = "$f0f$w$s$xF$f1fr$f2fu$f4fz$f6fz$f8fy";

        let actual = map_name(input).unwrap();

        let expected = vec![
            Fragment::Tag(Color(255, 0, 255)),
            Fragment::Tag(Wide),
            Fragment::Tag(Shadowed),
            Fragment::Text("F"),
            Fragment::Tag(Color(255, 17, 255)),
            Fragment::Text("r"),
            Fragment::Tag(Color(255, 34, 255)),
            Fragment::Text("u"),
            Fragment::Tag(Color(255, 68, 255)),
            Fragment::Text("z"),
            Fragment::Tag(Color(255, 102, 255)),
            Fragment::Text("z"),
            Fragment::Tag(Color(255, 136, 255)),
            Fragment::Text("y"),
        ];

        assert_eq!(expected, actual);
    }

    #[test]
    fn vogene() {
        let input = "$w$i$fobV$fffogene";

        let actual = map_name(input).unwrap();

        let expected = vec![
            Fragment::Tag(Wide),
            Fragment::Tag(Italic),
            Fragment::Tag(Color(255, 0, 187)),
            Fragment::Text("V"),
            Fragment::Tag(Color(255, 255, 255)),
            Fragment::Text("ogene"),
        ];

        assert_eq!(expected, actual);
    }

    #[test]
    fn cool_island() {
        let input = "$w$s$i$b$a«««$0f0CooL Evening";

        let actual = map_name(input).unwrap();

        let expected = vec![
            Fragment::Tag(Wide),
            Fragment::Tag(Shadowed),
            Fragment::Tag(Italic),
            Fragment::Tag(Color(170, 0, 0)),
            Fragment::Text("«"),
            Fragment::Tag(Color(0, 255, 0)),
            Fragment::Text("CooL Evening"),
        ];

        assert_eq!(expected, actual);
    }
}
