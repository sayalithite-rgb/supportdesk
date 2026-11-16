const fs = require('fs');
const path = require('path');

const templates = [
  ['Cannot access my account', 'Login page shows an error after entering the password.', 'account', 'login;account'],
  ['Invoice shows wrong amount', 'The latest invoice total does not match my plan.', 'billing', 'invoice;billing'],
  ['App crashes on upload', 'The app closes when I upload a large file.', 'technical', 'bug;upload'],
  ['Password reset email missing', 'I requested a reset link but nothing arrived.', 'account', 'login;email'],
  ['Request for dark mode', 'Please add a dark theme to the dashboard.', 'feature', 'feature-request'],
  ['Slow dashboard loading', 'The dashboard takes more than 20 seconds to open.', 'technical', 'performance'],
  ['Refund not received', 'I cancelled last week and have not received a refund.', 'billing', 'refund;billing'],
  ['Cannot change email address', 'The profile page does not save my new email.', 'account', 'profile;account'],
  ['Export to CSV fails', 'Clicking export shows an unknown error message.', 'technical', 'bug;export'],
  ['Need help with setup', 'I need guidance to configure my first project.', 'general', 'onboarding'],
];

const statuses = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
const priorities = ['P1', 'P2', 'P3', 'P4'];
const customers = ['customer.cara@example.com', 'customer.dev@example.com', 'customer.mia@example.com'];
const agents = ['agent.asha@supportdesk.test', 'agent.ravi@supportdesk.test'];

const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const header = ['title', 'description', 'status', 'priority', 'category', 'slaDueAt', 'createdByEmail', 'assigneeEmail', 'tags'];
const lines = [header.join(',')];

for (let i = 0; i < 50; i++) {
  const [title, description, category, tags] = templates[i % templates.length];
  const status = statuses[i % statuses.length];
  const due = new Date(Date.UTC(2026, 11, 1 + i, 10, 0, 0)).toISOString();
  const assignee = status === 'open' ? '' : agents[i % agents.length];
  lines.push([
    `${title} (#${i + 1})`, description, status, priorities[i % priorities.length],
    category, due, customers[i % customers.length], assignee, tags,
  ].map(q).join(','));
}

fs.writeFileSync(path.resolve(__dirname, '../docs/sample_tickets.csv'), lines.join('\n') + '\n');
console.log('Wrote docs/sample_tickets.csv with 50 tickets');