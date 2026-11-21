
export class MemberDeactivationService {
  validate({ actor, member }) {
    if (!actor) {
      throw Object.assign(
        new Error('Administrator account not found.'),
        { status: 401 }
      )
    }

    if (
      actor.role !== 'admin' ||
      actor.status !== 'active'
    ) {
      throw Object.assign(
        new Error('Only active administrators can deactivate members.'),
        { status: 403 }
      )
    }

    if (!member) {
      throw Object.assign(
        new Error('Member account not found.'),
        { status: 404 }
      )
    }

    if (!['user', 'member'].includes(member.role)) {
      throw Object.assign(
        new Error('Only member accounts can be deactivated.'),
        { status: 403 }
      )
    }

    if (!actor.id || !member.id) {
      throw Object.assign(
        new Error('Invalid account information.'),
        { status: 400 }
      )
    }

    return member
  }
}
