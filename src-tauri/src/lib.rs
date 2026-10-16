use std::sync::Mutex;

use tauri::{Emitter, Manager};
#[cfg(target_os = "macos")]
use tauri::WindowEvent;

struct PendingCutnotes(Mutex<Vec<String>>);

#[tauri::command]
fn take_pending_cutnotes(state: tauri::State<'_, PendingCutnotes>) -> Vec<String> {
  match state.0.lock() {
    Ok(mut pending) => std::mem::take(&mut *pending),
    Err(_) => Vec::new(),
  }
}

fn remember_opened_files(app: &tauri::AppHandle, event: &tauri::RunEvent) {
  #[cfg(target_os = "macos")]
  {
    let tauri::RunEvent::Opened { urls } = event else {
      return;
    };
    let mut raws = Vec::new();
    for url in urls {
      let Ok(path) = url.to_file_path() else {
        continue;
      };
      let is_cutnote = path
        .extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("cutnote"));
      if !is_cutnote {
        continue;
      }
      if let Ok(raw) = std::fs::read_to_string(&path) {
        raws.push(raw);
      }
    }
    if raws.is_empty() {
      return;
    }
    if let Some(state) = app.try_state::<PendingCutnotes>() {
      if let Ok(mut pending) = state.0.lock() {
        pending.extend(raws);
      }
    }
    let _ = app.emit("cutnote-open-ready", ());
  }
  #[cfg(not(target_os = "macos"))]
  {
    let _ = (app, event);
  }
}

/// Give the window a 52pt unified toolbar so macOS vertically centers the
/// traffic lights with the web title bar (`--titlebar-h` in index.css).
/// `trafficLightPosition` can't do this: it only resizes the titlebar container,
/// while the buttons stay pinned to its top.
///
/// Important: in native fullscreen this toolbar auto-hides with the menu bar and
/// takes the overlay titlebar band with it — so we remove it while fullscreen.
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
  // window events / setup run on the main thread (checked via `mtm` above).
  let ns_window: &NSWindow = unsafe { &*ptr.cast::<NSWindow>() };
  let toolbar = NSToolbar::new(mtm);
  ns_window.setToolbar(Some(&toolbar));
  ns_window.setToolbarStyle(NSWindowToolbarStyle::Unified);
  ns_window.setTitlebarSeparatorStyle(NSTitlebarSeparatorStyle::None);
}

#[cfg(target_os = "macos")]
fn clear_traffic_light_toolbar(window: &tauri::WebviewWindow) {
  use objc2::MainThreadMarker;
  use objc2_app_kit::NSWindow;

  if MainThreadMarker::new().is_none() {
    return;
  }
  let Ok(ptr) = window.ns_window() else {
    return;
  };
  // SAFETY: same as `center_traffic_lights`.
  let ns_window: &NSWindow = unsafe { &*ptr.cast::<NSWindow>() };
  ns_window.setToolbar(None);
}

#[cfg(target_os = "macos")]
fn sync_fullscreen_chrome(window: &tauri::WebviewWindow) {
  let Ok(fullscreen) = window.is_fullscreen() else {
    return;
  };
  if fullscreen {
    clear_traffic_light_toolbar(window);
  } else {
    center_traffic_lights(window);
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .manage(PendingCutnotes(Mutex::new(Vec::new())))
    .invoke_handler(tauri::generate_handler![take_pending_cutnotes])
    .setup(|app| {
      #[cfg(target_os = "macos")]
      if let Some(window) = app.get_webview_window("main") {
        center_traffic_lights(&window);
        let tracked = window.clone();
        window.on_window_event(move |event| {
          if matches!(event, WindowEvent::Resized(_)) {
            sync_fullscreen_chrome(&tracked);
          }
        });
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
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app, event| {
      remember_opened_files(app, &event);
    });
}
