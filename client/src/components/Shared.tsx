import React from 'react';
import type { Script } from '../api';

export function Stars({ score, count }: { score: number | null | undefined; count?: number }) {
  const s = Math.round(score || 0);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      {score != null && (
        <>
          <span className="rating-score">{Number(score).toFixed(1)}</span>
          <span className="stars">
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={i <= s ? '' : 'empty'}>&#9733;</span>
            ))}
          </span>
          {count != null && <span className="rating-count">({count}人评价)</span>}
        </>
      )}
    </span>
  );
}

export function DifficultyTag({ difficulty }: { difficulty: string }) {
  const labels: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  return <span className={`card-tag tag-${difficulty}`}>{labels[difficulty] || difficulty}</span>;
}

export function StatusTag({ status }: { status: string }) {
  if (status === 'available') {
    return <span className="card-tag tag-available">可用</span>;
  }
  return <span className="card-tag tag-maintenance">维护中</span>;
}
