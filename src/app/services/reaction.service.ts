import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';

export interface ReactionState {
  count: number;
  reacted: boolean;
}

/** "I'm affected" reactions: one per signed-in user per notice, publicly counted. */
@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  private firebaseService = inject(FirebaseService);

  async load(noticeId: string, uid: string | null): Promise<ReactionState> {
    const database = await this.firebaseService.getDatabase();
    const db = await this.firebaseService.getDatabaseMethods();
    if (!database || !db) return { count: 0, reacted: false };

    const snapshot = await db.get(db.ref(database, `reactions/${noticeId}`));
    const data: Record<string, boolean> = snapshot.val() ?? {};
    return { count: Object.keys(data).length, reacted: !!uid && !!data[uid] };
  }

  async setReacted(noticeId: string, uid: string, reacted: boolean): Promise<void> {
    const database = await this.firebaseService.getDatabase();
    const db = await this.firebaseService.getDatabaseMethods();
    if (!database || !db) throw new Error('Database not available');

    const reactionRef = db.ref(database, `reactions/${noticeId}/${uid}`);
    await (reacted ? db.set(reactionRef, true) : db.remove(reactionRef));
  }
}
