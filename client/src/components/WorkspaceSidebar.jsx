export function WorkspaceSidebar({
  workspaces,
  workspaceId,
  onSelect,
  onCreate,
  user,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">↗</span>
        <span>TeamFlow</span>
      </div>
      <p className="nav-label">WORKSPACES</p>
      <nav>
        {workspaces.map((workspace) => (
          <button
            key={workspace._id}
            className={`workspace-link ${workspace._id === workspaceId ? 'selected' : ''}`}
            onClick={() => onSelect(workspace._id)}
          >
            <span>{workspace.name.slice(0, 1).toUpperCase()}</span>
            {workspace.name}
          </button>
        ))}
      </nav>
      <button className="add-link" onClick={onCreate}>
        + New workspace
      </button>
      <div className="user-row">
        <span className="avatar">{user.name.slice(0, 1)}</span>
        <div>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
        <button aria-label="Sign out" onClick={onLogout}>
          ↪
        </button>
      </div>
    </aside>
  );
}
