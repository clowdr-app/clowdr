export function generateEventHandsRaisedKeyName(eventId: string): string {
    return `event:event.${eventId}.handRaise.users`;
}
export function generateEventHandsRaisedRoomName(eventId: string): string {
    return `event:event.${eventId}.handRaise.update`;
}
