import { useState } from 'react';
const columns = [
  ['todo', 'To do'],
  ['in_progress', 'In progress'],
  ['in_review', 'In review'],
  ['done', 'Done'],
];
export function TaskBoard({ tasks, onUpdate, onCreate }) {
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState('all');
  const visible =
    filter === 'all' ? tasks : tasks.filter((task) => task.priority === filter);
  async function create(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    await onCreate({ title: draft });
    setDraft('');
  }
  function drop(event, status) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (id) onUpdate(id, { status });
  }
  return (
    <>
      <div className="board-controls">
        <label>
          Priority{' '}
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
      <section className="board" aria-label="Kanban board">
        {columns.map(([status, label]) => (
          <section
            className="column"
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => drop(event, status)}
          >
            <header>
              <h3>{label}</h3>
              <span>{visible.filter((task) => task.status === status).length}</span>
            </header>
            <div className="task-list">
              {visible
                .filter((task) => task.status === status)
                .map((task) => (
                  <article
                    draggable
                    className="task-card"
                    onDragStart={(event) =>
                      event.dataTransfer.setData('text/plain', task._id)
                    }
                    key={task._id}
                  >
                    <span className={`priority ${task.priority}`}>{task.priority}</span>
                    <strong>{task.title}</strong>
                    {task.dueDate && (
                      <small>Due {new Date(task.dueDate).toLocaleDateString()}</small>
                    )}
                    <label className="move-label">
                      Move
                      <select
                        value={task.status}
                        onChange={(event) =>
                          onUpdate(task._id, { status: event.target.value })
                        }
                      >
                        {columns.map(([value, title]) => (
                          <option key={value} value={value}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
            </div>
            {status === 'todo' && (
              <form className="quick-add" onSubmit={create}>
                <input
                  aria-label="New task title"
                  placeholder="Add a task…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button aria-label="Add task">+</button>
              </form>
            )}
          </section>
        ))}
      </section>
    </>
  );
}
