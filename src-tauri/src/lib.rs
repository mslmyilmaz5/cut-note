#[cfg(target_os = "macos")]
use tauri::Manager;

/// Give the window a 52pt unified toolbar so macOS vertically centers the
/// traffic lights with the web title bar (`--titlebar-h` in index.css).
/// `trafficLightPosition` can't do this: it only resizes the titlebar container,
/// while the buttons stay pinned to its top.
#[cfg(target_os = "macos")]
fn center_traffic_lights(window: &tauri::WebviewWindow) {
  use objc2::MainThreadMarker;
  use objc2_app_kit::{NSTitlebarSeparatorStyle, NSToolbar, NSWindow, NSWindowToolbarStyle};

  let Some(mtm) = MainThreadMarker::new() else {
    return;
  };
  let Ok(ptr) = window.ns_window() else {
    return;
  };
  // SAFETY: Tauri returns the live NSWindow for this webview window, and
  // `setup` runs on the main thread (checked via `mtm` above).
  let ns_window: &NSWindow = unsafe { &*ptr.cast::<NSWindow>() };
  let toolbar = NSToolbar::new(mtm);
  ns_window.setToolbar(Some(&toolbar));
  ns_window.setToolbarStyle(NSWindowToolbarStyle::Unified);
  ns_window.setTitlebarSeparatorStyle(NSTitlebarSeparatorStyle::None);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      #[cfg(target_os = "macos")]
      if let Some(window) = app.get_webview_window("main") {
        center_traffic_lights(&window);
      }
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
