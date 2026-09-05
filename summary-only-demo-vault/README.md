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
