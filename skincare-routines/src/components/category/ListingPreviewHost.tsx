import { ListingSheet } from './ListingSheet';
import { closeListing, useListingPreview } from '../../state/listingPreviewStore';

/** Mounted once in the app shell: shows the product sheet for whichever listing was opened in place via `openListing`. */
export function ListingPreviewHost() {
  const listing = useListingPreview();
  if (!listing) return null;
  return <ListingSheet listing={listing} onClose={closeListing} onGoToList={closeListing} />;
}
