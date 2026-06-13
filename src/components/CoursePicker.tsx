import { useMemo, useState } from 'react'
import { searchCourses } from '@/engine/courses'
import { c } from '@/styles'

export function CoursePicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [query, setQuery] = useState(value)
  const results = useMemo(() => searchCourses(query), [query])

  return (
    <div>
      <input
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        placeholder="Search courses"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 12,
          borderRadius: 12,
          border: `1px solid ${c.line}`,
          background: c.card,
          color: c.cream,
          fontSize: 14,
          marginBottom: 8
        }}
      />
      {query.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
          {results.map(course => (
            <button
              key={course.name}
              className="dt-btn"
              onClick={() => {
                setQuery(course.name)
                onChange(course.name)
              }}
              style={{
                textAlign: 'left',
                padding: 10,
                borderRadius: 10,
                background: value === course.name ? 'rgba(201,162,75,.12)' : c.card,
                border: `1px solid ${c.line}`,
                color: c.cream
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{course.name}</div>
              {course.sub ? <div style={{ fontSize: 11, color: c.muted }}>{course.sub}</div> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
