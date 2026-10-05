# Data

The notebooks expect two files in this folder.

| File | Size | In git? | Description |
|---|---|---|---|
| `Divar.csv` | ~758 MB | No | 1,000,000 real-estate listings from Divar, 61 columns |
| `iran_city_classification.csv` | 6 KB | Yes | Maps each city name to `کلان‌شهر` (megacity) or `شهر کوچک` (small city) |

## Getting `Divar.csv`

The listings file is far past GitHub's 100 MB per-file limit, so it is not committed. Download it and
drop it in this folder:

```
data/
├── Divar.csv                        <- place it here
├── iran_city_classification.csv
└── README.md
```

The dataset is the public **Divar real-estate listings** export. Any copy with the original column
names works — the notebooks read only the columns they need via `usecols`, so a partial export is fine
as long as these are present:

```
cat2_slug, cat3_slug, city_slug, neighborhood_slug, created_at_month,
rent_value, credit_value, price_value, land_size, building_size, construction_year,
rooms_count, has_business_deed, location_latitude, location_longitude,
has_balcony, has_elevator, has_parking, has_warehouse, has_security_guard,
has_barbecue, has_pool, has_jacuzzi, has_sauna, has_heating_system
```

## Memory

`Divar.csv` does not fit comfortably in memory as a whole. Every notebook loads only the columns it
needs rather than the full frame — the descriptive notebook reads 23 of the 61 columns, the clustering
section 11. Expect roughly 3–4 GB of RAM at peak.

## Notes on the columns

- **Prices are in Toman.** `price_value` is the sale price, `credit_value` the deposit (رهن) and
  `rent_value` the monthly rent. A listing has either a sale price or a deposit/rent pair, not both.
- **`construction_year` is text**, written with Persian digits, and uses `قبل از ۱۳۷۰` for anything
  older than 1370. The notebooks translate the digits and map that bucket to 1369.
- **Boolean columns are mixed**: `True`, `"true"`, `"false"` and `"unselect"` all appear. `unselect`
  means the field was never filled in and is treated as missing, not as `False`.
- **Coordinates are missing for about a third of listings**, and a few fall outside Iran's bounding
  box. The geographic sections drop those rows.
