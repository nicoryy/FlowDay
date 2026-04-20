import datetime
from typing import Literal

from app.models.execution_log import ExecutionLog
from app.models.task import Task
from app.repositories.stats_repository import StatsRepository
from app.schemas.stats import DailyStat, PriorityStat, StatsSummary, StatsResponse

PRIORITY_LABELS = {1: "Alta", 2: "Média", 3: "Baixa"}


class StatsService:
    def __init__(self, stats_repo: StatsRepository) -> None:
        self._repo = stats_repo

    async def compute(
        self,
        period: Literal["day", "week"],
        reference_date: datetime.date,
    ) -> StatsResponse:
        date_to = reference_date
        date_from = reference_date if period == "day" else reference_date - datetime.timedelta(days=6)

        dt_from = datetime.datetime.combine(date_from, datetime.time.min, tzinfo=datetime.timezone.utc)
        dt_to = datetime.datetime.combine(date_to, datetime.time.max, tzinfo=datetime.timezone.utc)

        rows: list[tuple[ExecutionLog, Task]] = await self._repo.get_logs_with_tasks_in_range(
            dt_from, dt_to
        )

        # Build daily buckets
        num_days = (date_to - date_from).days + 1
        daily_map: dict[datetime.date, dict] = {}
        for i in range(num_days):
            d = date_from + datetime.timedelta(days=i)
            daily_map[d] = {"scheduled": 0, "done": 0, "logged_minutes": 0, "deviations": []}

        total_scheduled = 0
        total_done = 0
        total_logged_minutes = 0
        deviations: list[float] = []

        # priority buckets: {priority: {done, total_minutes}}
        priority_map: dict[int, dict] = {
            1: {"done": 0, "total_minutes": 0},
            2: {"done": 0, "total_minutes": 0},
            3: {"done": 0, "total_minutes": 0},
        }

        for log, task in rows:
            log_date = _to_date(log.created_at)
            bucket = daily_map.get(log_date)
            if bucket is None:
                continue

            bucket["scheduled"] += 1
            total_scheduled += 1

            if log.completed:
                bucket["done"] += 1
                total_done += 1

                p = task.priority if task.priority in priority_map else 3
                priority_map[p]["done"] += 1

                if log.actual_start and log.actual_end:
                    real_min = (log.actual_end - log.actual_start).total_seconds() / 60
                    bucket["logged_minutes"] += int(real_min)
                    total_logged_minutes += int(real_min)
                    priority_map[p]["total_minutes"] += int(real_min)
                    deviation = real_min - task.estimated_minutes
                    deviations.append(deviation)
                    bucket["deviations"].append(deviation)

        daily = [
            DailyStat(
                date=d,
                scheduled=v["scheduled"],
                done=v["done"],
                logged_minutes=v["logged_minutes"],
                completion_rate=round(v["done"] / v["scheduled"], 3) if v["scheduled"] else 0.0,
            )
            for d, v in sorted(daily_map.items())
        ]

        by_priority = [
            PriorityStat(
                priority=p,
                label=PRIORITY_LABELS[p],
                done=vals["done"],
                total_minutes=vals["total_minutes"],
            )
            for p, vals in priority_map.items()
        ]

        summary = StatsSummary(
            total_scheduled=total_scheduled,
            total_done=total_done,
            completion_rate=round(total_done / total_scheduled, 3) if total_scheduled else 0.0,
            total_logged_minutes=total_logged_minutes,
            avg_deviation_minutes=round(sum(deviations) / len(deviations), 1) if deviations else 0.0,
        )

        return StatsResponse(
            period=period,
            date_from=date_from,
            date_to=date_to,
            summary=summary,
            daily=daily,
            by_priority=by_priority,
        )


def _to_date(dt: datetime.datetime) -> datetime.date:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc).date()
