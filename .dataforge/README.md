# DataForge workspace

This directory is created by `/init` and stores durable agent state and reproducible analysis artifacts.

`state.json` records the current workflow status, checks, assumptions, and artifact paths. `notebooks/` stores executed Jupyter notebooks, `reports/` stores summaries, and `runs/` stores run logs. Keep raw datasets outside this directory unless the project explicitly requires otherwise.
