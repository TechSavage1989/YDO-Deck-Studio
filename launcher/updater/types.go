package updater

type Manifest struct {
	Schema    int      `json:"schema"`
	AppID     string   `json:"app_id"`
	Version   string   `json:"version"`
	Tag       string   `json:"tag"`
	AssetName string   `json:"asset_name"`
	SHA256    string   `json:"sha256"`
	Size      int64    `json:"size"`
	Notes     []string `json:"notes"`
}

type ReleaseInfo struct {
	Version     string   `json:"version"`
	Tag         string   `json:"tag"`
	PageURL     string   `json:"page_url"`
	AssetName   string   `json:"asset_name"`
	AssetURL    string   `json:"asset_url"`
	SHA256      string   `json:"sha256"`
	Size        int64    `json:"size"`
	Notes       []string `json:"notes"`
	ReadMore    bool     `json:"read_more"`
	ReleaseBody string   `json:"-"`
}

type Status struct {
	State            string       `json:"state"`
	InstalledVersion string       `json:"installed_version"`
	Latest           *ReleaseInfo `json:"latest,omitempty"`
	Message          string       `json:"message,omitempty"`
	LastCheckedAt    string       `json:"last_checked_at,omitempty"`
	BackoffUntil     string       `json:"backoff_until,omitempty"`
	Downloaded       bool         `json:"downloaded"`
	DownloadProgress int          `json:"download_progress"`
	DownloadPath     string       `json:"-"`
}
