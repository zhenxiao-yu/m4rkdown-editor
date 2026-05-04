interface UpdateBannerProps {
    onUpdate: () => void;
}

export function UpdateBanner({ onUpdate }: UpdateBannerProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '8px 16px',
            backgroundColor: '#1e3a1e',
            borderBottom: '1px solid #2d5a2d',
            fontSize: '13px',
            color: '#90d090',
            flexShrink: 0,
        }}>
            <span>A new version of M4rkdown is available.</span>
            <button
                onClick={onUpdate}
                style={{
                    padding: '3px 12px',
                    borderRadius: '4px',
                    border: '1px solid #2d5a2d',
                    backgroundColor: '#2d5a2d',
                    color: '#90d090',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3a7a3a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2d5a2d'; }}
            >
                Refresh
            </button>
        </div>
    );
}
