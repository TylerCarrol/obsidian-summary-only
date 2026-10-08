# SummaryOnly: Test Vault

## Try the Summary only view

1. Build and copy the plugin into this vault:

	```powershell
	..\scripts\build-to-demo-vault.ps1
	```

2. Open `Summary.base` in Obsidian.
3. Select the **Summary Only** view.

The view filters the ten notes tagged `dataitem` and displays these cards:

- `number` with the `Sum` value `992.2`
- `file.size` with the `Average` value `37.5`

The **Table** view remains available for comparison. Edit a data note or the
Base filters and the Summary Only cards update automatically.

Open the Summary Only view settings to adjust **Card width** and **Card height**
with sliders.

## Try grouped summaries

1. Open `Grouped summaries.base` in Obsidian.
2. Select the **Grouped summaries** view.

This Base filters five sample notes tagged `summarygroupitem`. It groups the
notes by their `group` property and shows these Number sums:

| Section | Sum |
| --- | ---: |
| All | 50 |
| Group A | 30 |
| Group B | 20 |
| No value | 0 |

The **All** section appears first. The Base controls the order of the other
sections. The **Grouped table** view shows the source entries.

1. In the view settings, turn off **Show All summary**.
2. Enable **Show summary editor** to change the summary for every group.

Without the All section, the three group sections remain visible. Summary
choices apply to every section, not to an individual group.

The sample notes are in `GroupedData/`. They do not change the original
`Summary.base` example.
