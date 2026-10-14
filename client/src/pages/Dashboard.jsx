import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { useAuth } from '../context/AuthContext.jsx';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar.jsx';
import { TaskBoard } from '../components/TaskBoard.jsx';
import { Modal } from '../components/Modal.jsx';
export function Dashboard() {
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [modal, setModal] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api('/workspaces')
      .then(({ workspaces }) => {
        setWorkspaces(workspaces);
        if (workspaces[0]) setWorkspaceId(workspaces[0]._id);
      })
      .catch((err) => setError(err.message));
  }, []);
  useEffect(() => {
    if (!workspaceId) return;
    api(`/workspaces/${workspaceId}/projects`).then(({ projects }) => {
      setProjects(projects);
      setProjectId(projects[0]?._id || '');
    });
    api(`/workspaces/${workspaceId}/analytics`)
      .then(setMetrics)
      .catch(() => {});
  }, [workspaceId]);
  useEffect(() => {
    if (projectId)
      api(`/projects/${projectId}/tasks`)
        .then(({ tasks }) => setTasks(tasks))
        .catch((err) => setError(err.message));
    else setTasks([]);
  }, [projectId]);
  async function createWorkspace(data) {
    const result = await api('/workspaces', { method: 'POST', body: data });
    setWorkspaces([...workspaces, result.workspace]);
    setWorkspaceId(result.workspace._id);
    setModal('');
  }
  async function createProject(data) {
    const { project } = await api(`/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: data,
    });
    setProjects([...projects, project]);
    setProjectId(project._id);
    setModal('');
  }
  async function createTask(data) {
    const { task } = await api(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: data,
    });
    setTasks([...tasks, task]);
  }
  async function updateTask(id, data) {
    const { task } = await api(`/tasks/${id}`, { method: 'PATCH', body: data });
    setTasks(tasks.map((item) => (item._id === id ? task : item)));
  }
  const workspace = workspaces.find((item) => item._id === workspaceId);
  return (
    <div className="app-shell">
      <WorkspaceSidebar
        workspaces={workspaces}
        workspaceId={workspaceId}
        onSelect={setWorkspaceId}
        onCreate={() => setModal('workspace')}
        user={user}
        onLogout={logout}
      />
      <main className="content">
        <header className="toolbar">
          <div>
            <p className="eyebrow">{workspace?.name || 'GET STARTED'}</p>
            <h1>
              {projectId
                ? projects.find((p) => p._id === projectId)?.name
                : 'Your workspace'}
            </h1>
          </div>
          <div>
            <button
              className="secondary"
              onClick={() => setModal('project')}
              disabled={!workspaceId}
            >
              + New project
            </button>
            <button
              className="primary"
              onClick={() => setModal('task')}
              disabled={!projectId}
            >
              + New task
            </button>
          </div>
        </header>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!workspaceId ? (
          <section className="empty">
            <h2>Start a focused workspace</h2>
            <p>Create a workspace for the people and projects moving together.</p>
            <button className="primary" onClick={() => setModal('workspace')}>
              Create workspace
            </button>
          </section>
        ) : (
          <>
            <section className="metrics" aria-label="Workspace analytics">
              {[
                ['All tasks', metrics?.totals.all],
                ['Completed', metrics?.totals.completed],
                ['Pending', metrics?.totals.pending],
                ['Overdue', metrics?.totals.overdue],
              ].map(([label, value]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{value ?? '—'}</strong>
                </article>
              ))}
            </section>
            <div className="project-tabs" role="tablist">
              {projects.map((project) => (
                <button
                  role="tab"
                  aria-selected={project._id === projectId}
                  className={project._id === projectId ? 'active' : ''}
                  onClick={() => setProjectId(project._id)}
                  key={project._id}
                >
                  {project.name}
                </button>
              ))}
            </div>
            {projectId ? (
              <TaskBoard tasks={tasks} onCreate={createTask} onUpdate={updateTask} />
            ) : (
              <section className="empty">
                <h2>No projects yet</h2>
                <p>Projects collect work into a clear, shared plan.</p>
                <button className="primary" onClick={() => setModal('project')}>
                  Create project
                </button>
              </section>
            )}
          </>
        )}
        {modal && (
          <CreateModal
            type={modal}
            onClose={() => setModal('')}
            onSubmit={
              modal === 'workspace'
                ? createWorkspace
                : modal === 'project'
                  ? createProject
                  : createTask
            }
          />
        )}
      </main>
    </div>
  );
}
function CreateModal({ type, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const labels = {
    workspace: 'Create workspace',
    project: 'Create project',
    task: 'Create task',
  };
  async function submit(event) {
    event.preventDefault();
    await onSubmit(
      type === 'task' ? { title: name, description } : { name, description },
    );
  }
  return (
    <Modal title={labels[type]} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          {type === 'task' ? 'Task title' : 'Name'}
          <input
            autoFocus
            required
            minLength="2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button className="primary">Create</button>
      </form>
    </Modal>
  );
}
