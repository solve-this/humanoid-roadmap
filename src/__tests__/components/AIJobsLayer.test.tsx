import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AIJobsLayer from '../../components/AIJobsLayer'
import type { JobTaskEntry, JobRollup } from '../../types/forecast-jobs'

const mockCatalog: JobTaskEntry[] = [
  {
    job_id: 'customer-support-agent',
    job_title: 'Customer Support Agent',
    industry: 'services',
    tasks: [
      { task_id: 'csa-ticket-resolution', task_name: 'Ticket Resolution', task_type: 'digital', task_unit: 'tickets_resolved_per_day', automatable: true },
      { task_id: 'csa-escalation-routing', task_name: 'Escalation Routing', task_type: 'judgment', task_unit: 'escalations_per_day', automatable: false },
    ],
  },
  {
    job_id: 'warehouse-order-picker',
    job_title: 'Warehouse Order Picker',
    industry: 'logistics',
    tasks: [
      { task_id: 'wh-pick-item', task_name: 'Item Picking', task_type: 'physical', task_unit: 'items_per_hour', automatable: true },
      { task_id: 'wh-exception-handling', task_name: 'Exception Handling', task_type: 'judgment', task_unit: 'exceptions_per_day', automatable: false },
    ],
  },
]

const mockRollupsEmpty: JobRollup[] = []

const mockRollupsFilled: JobRollup[] = [
  {
    date: '2027-06-01',
    job_id: 'customer-support-agent',
    agent_work_share: 0.62,
    human_work_share: 0.38,
    jobs_exposed: 4,
    jobs_displaced_estimate_low: 0.31,
    jobs_displaced_estimate_high: 0.62,
    confidence: 'medium',
  },
]

describe('AIJobsLayer', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />
    )
    expect(container).toBeTruthy()
  })

  it('renders the AI JOBS trigger button', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />)
    expect(screen.getByLabelText('AI vs Human Jobs')).toBeTruthy()
  })

  it('opens the drawer when trigger is clicked', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    expect(screen.getByText(/AI-Agent Work vs Human Jobs/i)).toBeTruthy()
  })

  it('shows evidence-collection-in-progress state when no rollup data', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    expect(screen.getByText(/EVIDENCE COLLECTION IN PROGRESS/i)).toBeTruthy()
  })

  it('shows catalog preview with correct occupation count in empty state', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    expect(screen.getByText(/Tracking 2 occupations/i)).toBeTruthy()
  })

  it('lists job titles in catalog preview when empty', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    expect(screen.getByText('Customer Support Agent')).toBeTruthy()
    expect(screen.getByText('Warehouse Order Picker')).toBeTruthy()
  })

  it('shows work share bars when rollup data is available', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsFilled} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    expect(screen.getByText(/AI Agent: 62%/i)).toBeTruthy()
    expect(screen.getByText(/Human: 38%/i)).toBeTruthy()
  })

  it('shows confidence badge in data state', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsFilled} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    expect(screen.getByText(/MEDIUM CONF/i)).toBeTruthy()
  })

  it('closes the drawer when X is clicked', () => {
    render(<AIJobsLayer jobTaskCatalog={mockCatalog} jobRollups={mockRollupsEmpty} />)
    fireEvent.click(screen.getByLabelText('AI vs Human Jobs'))
    fireEvent.click(screen.getByLabelText('Close'))
    // Trigger button is visible again
    expect(screen.getByLabelText('AI vs Human Jobs')).toBeTruthy()
  })
})
