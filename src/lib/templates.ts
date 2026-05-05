export interface Template {
    id: string;
    name: string;
    icon: string;
    content: string;
}

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const dayFull = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export const TEMPLATES: Template[] = [
    {
        id: 'blog-post',
        name: 'Blog Post',
        icon: '✍️',
        content: `# Blog Post Title\n\n*Published: ${today}*\n\n## Introduction\n\nWrite your introduction here…\n\n## Main Content\n\n### Section 1\n\nContent here.\n\n### Section 2\n\nContent here.\n\n## Conclusion\n\nWrap up your thoughts.\n`,
    },
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        icon: '📝',
        content: `# Meeting Notes\n\n**Date:** ${today}\n**Attendees:**\n**Facilitator:**\n\n## Agenda\n\n- [ ] Item 1\n- [ ] Item 2\n\n## Notes\n\n## Action Items\n\n| Task | Owner | Due Date |\n|------|-------|----------|\n| | | |\n\n## Next Meeting\n\n`,
    },
    {
        id: 'project-readme',
        name: 'Project README',
        icon: '📦',
        content: `# Project Name\n\n> Short description of the project.\n\n## Features\n\n- Feature 1\n- Feature 2\n\n## Installation\n\n\`\`\`bash\nnpm install project-name\n\`\`\`\n\n## Usage\n\n\`\`\`js\nconst project = require('project-name');\n\`\`\`\n\n## Contributing\n\nPull requests welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.\n\n## License\n\nMIT\n`,
    },
    {
        id: 'daily-journal',
        name: 'Daily Journal',
        icon: '📔',
        content: `# ${dayFull}\n\n## How I'm feeling today\n\n\n## What I accomplished\n\n- \n\n## What I'm grateful for\n\n1. \n2. \n3. \n\n## Tomorrow's priorities\n\n- [ ] \n`,
    },
    {
        id: 'todo-list',
        name: 'TODO List',
        icon: '✅',
        content: `# TODO List\n\n## High Priority\n\n- [ ] \n- [ ] \n\n## Medium Priority\n\n- [ ] \n- [ ] \n\n## Low Priority\n\n- [ ] \n\n## Done\n\n- [x] Created this list\n`,
    },
    {
        id: 'resume',
        name: 'Resume',
        icon: '💼',
        content: `# Your Name\n\n**Email:** you@example.com | **Phone:** (555) 000-0000\n\n---\n\n## Summary\n\nBrief professional summary.\n\n## Experience\n\n### Job Title — Company Name\n*Jan 2022 – Present*\n\n- Achievement 1\n- Achievement 2\n\n## Education\n\n### Degree — University\n*Graduated Year*\n\n## Skills\n\n**Languages:** ...\n**Tools:** ...\n`,
    },
];
