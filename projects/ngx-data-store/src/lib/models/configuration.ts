export class Configuration {
  api_datastore_base_url: string = 'https://localhost:8000/';
  api_project_key: string = '';
  front_callback_path: string = 'logged';
  front_logged_path: string = '';
  front_login_path: string = 'login';
  local_storage_auth_key: string = 'token';
  store_default_max_hour_outdated: number = 24;
  offline_mode = false;
}
