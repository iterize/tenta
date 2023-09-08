import datetime
import time
from typing import Optional, Union
import wetterdienst
from wetterdienst.provider.dwd.observation import (
    DwdObservationRequest,
    DwdObservationResolution,
    DwdObservationParameter,
)
import json

today = datetime.datetime.utcnow().date()
settings = wetterdienst.Settings(ts_shape="long", ts_humanize=True, ts_si_units=True)

request = DwdObservationRequest(
    parameter=[
        DwdObservationParameter.HOURLY.PRESSURE.PRESSURE_AIR_SITE,
        DwdObservationParameter.HOURLY.TEMPERATURE_AIR.TEMPERATURE_AIR_MEAN_200,
        DwdObservationParameter.HOURLY.WIND.WIND_DIRECTION,
        DwdObservationParameter.HOURLY.WIND.WIND_SPEED,
    ],
    resolution=DwdObservationResolution.HOURLY,
    start_date=(today - datetime.timedelta(days=28)).strftime("%Y-%m-%d"),
    end_date=today.strftime("%Y-%m-%d"),
    settings=settings,
).filter_by_station_id(station_id=(1262))

df = request.values.all().df
df = df.drop("station_id", "dataset", "quality")

dummy_log_records: list[dict] = []

for row in df.iter_rows():
    key = row[0]
    time = row[1]
    value = row[2]
    assert isinstance(key, str)
    assert isinstance(time, datetime.datetime)
    assert isinstance(value, Optional[Union[int, float]]), type(value)

    dummy_log_records.append(
        {
            "sensor_identifier": "81bf7042-e20f-4a97-ac44-c15853e3618f",
            "attribute": key,
            "value": value,
            "revision": None,
            "creation_timestamp": time.timestamp(),
            "receipt_timestamp": time.timestamp(),
        }
    )

with open("../server/tests/data.json", "r") as f:
    current_test_data = json.load(f)

current_test_data["measurement"] += dummy_log_records

with open("../server/tests/moritz_data.json", "w") as f:
    json.dump(current_test_data, f, indent=4)
