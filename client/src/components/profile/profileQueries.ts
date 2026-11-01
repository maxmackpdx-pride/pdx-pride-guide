import type {QueryClient} from '@tanstack/react-query';
export const profileQueries={all:['profile'] as const,projection:(username:string,viewerId:number|null)=>['profile',username,viewerId] as const,layout:(ownerId?:number)=>['/api/users/me/profile-layout',ownerId] as const};
/** Existing domain mutations own notifications; this only refreshes their profile projection. */
export function invalidateProfileMutation(client:QueryClient,method:string,url:string){
 if(['GET','HEAD'].includes(method.toUpperCase()))return;
 if(/^\/api\/(events\/|boards\/|board-collection|housing|gig|gifting|sellz|outz|users\/me|users\/[^/]+\/follow|hub\/posts|hearts|venues\/|directory\/|pack)/.test(url)){
  void client.invalidateQueries({queryKey:profileQueries.all});
  void client.invalidateQueries({queryKey:['/api/board-collection']});
  void client.invalidateQueries({queryKey:['/api/users/me/people/following']});
 }
}
