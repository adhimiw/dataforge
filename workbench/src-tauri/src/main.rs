#[cfg(feature = "desktop")]
mod desktop {
    use dataforge_workbench::WorkbenchSnapshot;
    use std::sync::Mutex;
    use tauri::State;
    struct AppState(Mutex<WorkbenchSnapshot>);
    #[tauri::command]
    fn workbench_snapshot(state: State<'_, AppState>) -> Result<WorkbenchSnapshot, String> {
        state
            .0
            .lock()
            .map(|value| value.clone())
            .map_err(|_| "Local workbench state is unavailable".into())
    }
    #[tauri::command]
    fn resolve_approval(
        approval_id: String,
        approve: bool,
        state: State<'_, AppState>,
    ) -> Result<WorkbenchSnapshot, String> {
        let mut value = state
            .0
            .lock()
            .map_err(|_| "Local workbench state is unavailable".to_string())?;
        value
            .resolve(&approval_id, approve)
            .map_err(|error| error.to_string())?;
        Ok(value.clone())
    }
    pub fn run() {
        tauri::Builder::default()
            .manage(AppState(Mutex::new(WorkbenchSnapshot::demo())))
            .invoke_handler(tauri::generate_handler![
                workbench_snapshot,
                resolve_approval
            ])
            .run(tauri::generate_context!())
            .expect("DataForge Workbench desktop host could not start");
    }
}
#[cfg(feature = "desktop")]
fn main() {
    desktop::run();
}
#[cfg(not(feature = "desktop"))]
fn main() {
    eprintln!("Build with --features desktop to run DataForge Workbench.");
}
