use askama::Template;
use axum::{extract::Extension, response::Html};
use mysql_async::prelude::*;
use time::{Duration, OffsetDateTime, PrimitiveDateTime};
use tracing::error;

use std::collections::BTreeMap;

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {
    maps: BTreeMap<Map, Vec<Record>>,
}

#[derive(Debug, Clone, Eq)]
struct Map {
    id: u64,
    name: String,
    author: String,
    //environment: String,
}

impl Ord for Map {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.name.cmp(&other.name)
    }
}

impl PartialOrd for Map {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for Map {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

#[derive(Debug, Clone)]
struct Record {
    player: String,
    country: &'static str,
    time: DisplayDuration,
    date: DisplayDateTime,
}

pub async fn root(
    Extension(pool): Extension<mysql_async::Pool>,
    // FIXME Create an actual error page
) -> Result<Html<String>, crate::api::ApiError> {
    let mut conn = pool.get_conn().await?;

    let loaded_scores = conn
        .exec_iter(
            "SELECT
                challenges.Id,
                CONVERT(CAST(challenges.Name as BINARY) USING utf8),
                challenges.Author,
                challenges.Environment,
                players.Login,
                players.Nation,
                records.Score,
                records.Date
            FROM challenges
            JOIN records ON challenges.Id = records.ChallengeId
            JOIN players ON records.PlayerId = players.Id",
            (),
        )
        .await?
        .collect::<(
            // Id
            u64,
            // Name
            String,
            // Author
            String,
            // Environment
            String,
            // Player
            String,
            // Country
            String,
            // Time
            i64,
            // Date
            PrimitiveDateTime,
        )>()
        .await?;

    let mut maps = BTreeMap::new();
    for (id, name, author, _environment, player, country, time, date) in loaded_scores {
        let map = Map {
            id,
            name: crate::util::styling_to_html(&name),
            author,
            //environment,
        };

        let records = maps.entry(map).or_insert_with(Vec::new);

        let record = Record {
            player,
            country: map_country(&country),
            time: DisplayDuration(Duration::milliseconds(time)),
            date: DisplayDateTime(date.assume_utc()),
        };
        records.push(record);
    }

    for records in maps.values_mut() {
        records.sort_by(|a, b| a.time.cmp(&b.time));
    }

    Ok(Html(IndexTemplate { maps }.render().unwrap()))
}

pub fn map_country(name: &str) -> &'static str {
    match name {
        "ALG" => "dz",
        "ANG" => "ao",
        "ARG" => "ar",
        "AUS" => "au",
        "AUT" => "at",
        "BAN" => "bd",
        "BEL" => "be",
        "BIH" => "ba",
        "BLR" => "by",
        "BOL" => "bo",
        "BRA" => "br",
        "BRN" => "bh",
        "BUL" => "bg",
        "CAN" => "ca",
        "CGO" => "cg",
        "CHI" => "cl",
        "CHN" => "cn",
        "CIV" => "ci",
        "CMR" => "cm",
        "COL" => "co",
        "CRO" => "hr",
        "CYP" => "cy",
        "CZE" => "cz",
        "DEN" => "dk",
        "ECU" => "ec",
        "EGY" => "eg",
        "ESP" => "es",
        "EST" => "ee",
        "FIN" => "fi",
        "FRA" => "fr",
        "GBR" => "gb",
        "GER" => "de",
        "GRE" => "gr",
        "GUA" => "gt",
        "HUN" => "hu",
        "INA" => "id",
        "IND" => "in",
        "IRL" => "ie",
        "IRI" => "ir",
        "IRQ" => "iq",
        "ISL" => "is",
        "ISR" => "il",
        "ITA" => "it",
        "JPN" => "jp",
        "KAZ" => "kz",
        "KEN" => "ke",
        "KOR" => "kr",
        "KSA" => "sa",
        "KUW" => "kw",
        "LAT" => "lv",
        "LIB" => "lb",
        "LTU" => "lt",
        "LUX" => "lu",
        "MAS" => "my",
        "MDA" => "md",
        "MEX" => "mx",
        "MKD" => "mk",
        "MLT" => "mt",
        "MNE" => "me",
        "MGL" => "mn",
        "MAR" => "ma",
        "NED" => "nl",
        "NOR" => "no",
        "NZL" => "nz",
        "PAK" => "pk",
        "PER" => "pe",
        "PHI" => "ph",
        "POL" => "pl",
        "POR" => "pt",
        "PAR" => "py",
        "ROU" => "ro",
        "RUS" => "ru",
        "SEN" => "sn",
        "SGP" => "sg",
        "SLO" => "si",
        "SVK" => "sk",
        "SRB" => "rs",
        "SUI" => "ch",
        "SWE" => "se",
        "THA" => "th",
        "TUN" => "tn",
        "TUR" => "tr",
        "TWN" => "tw",
        "UKR" => "ua",
        "URU" => "uy",
        "USA" => "us",
        "VEN" => "ve",
        "VIE" => "vn",
        "RSA" => "za",

        // UK
        "ENG" => "gb",
        "SCO" => "gb",
        "WAL" => "gb",

        // Supranational
        "EUR" => "eu",
        "AFR" => "af",
        "ARB" => "ar",
        "CIS" => "ru",
        _ => {
            error!("Unknown Country Code: {}", name);
            "global"
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct DisplayDuration(pub Duration);

impl std::fmt::Display for DisplayDuration {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let minutes = self.whole_minutes() as i128;
        let seconds = (self.whole_milliseconds() - minutes * 60000) as f64 / 1000.0;
        write!(f, "{:02}:{:05.2}", minutes, seconds,)
    }
}

impl std::ops::Deref for DisplayDuration {
    type Target = Duration;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Debug, Clone, Copy)]
pub struct DisplayDateTime(pub OffsetDateTime);

impl std::fmt::Display for DisplayDateTime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let format =
            time::format_description::parse("[day].[month].[year] [hour]:[minute]").unwrap();
        write!(f, "{}", self.0.format(&format).unwrap())
    }
}

impl std::ops::Deref for DisplayDateTime {
    type Target = OffsetDateTime;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
