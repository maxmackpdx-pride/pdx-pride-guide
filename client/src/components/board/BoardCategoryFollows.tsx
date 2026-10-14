import { useState, type CSSProperties } from 'react';
import { Bell } from 'lucide-react';
import BoardFollowButton from '@/components/BoardFollowButton';
import { boardFollowChoices } from '@/lib/boardFollowChoices';
import './BoardCategoryFollows.css';

/** Following is independent of the category currently being browsed. No bulk subscribe. */
export default function BoardCategoryFollows() {
  const [open,setOpen]=useState(false);
  return <details className="board-category-follows" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary className="eb-tool"><Bell size={16} aria-hidden="true" />Follow categories</summary>
    {open && <>
      <p>New posts from categories you follow appear in your Hub’s Following feed.</p>
      <ul aria-label="Categories to follow">
        {boardFollowChoices.map(category=><li key={category.id} className="pdx-glass-rebind" style={{'--c':category.color} as CSSProperties}>
          <span className="board-category-follows__identity"><img src={`/brand/family/${category.logo}`} alt="" /><strong>{category.label}</strong></span>
          <BoardFollowButton board={category.followRoom} />
        </li>)}
      </ul>
    </>}
  </details>;
}
