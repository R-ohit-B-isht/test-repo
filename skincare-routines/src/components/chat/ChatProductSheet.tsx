import { ListingSheet } from '../category/ListingSheet';
import { closeChat, closeProduct, type ProductPreview } from '../../chat/chatStore';

/** A listing cited in an answer, opened over the chat in the same sheet the list pages use — same evidence panel, same
 * score breakdown, same buy link — with a shortcut to its place in the ranked list. */
export function ChatProductSheet({ preview }: { preview: ProductPreview | null }) {
  if (!preview) return null;
  return <ListingSheet listing={preview} onClose={closeProduct} onGoToList={closeChat} />;
}
