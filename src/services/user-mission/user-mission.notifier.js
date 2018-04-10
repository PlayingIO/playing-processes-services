import fp from 'mostly-func';
import { helpers } from 'mostly-feathers-mongoose';
import { helpers as feeds } from 'playing-feed-services';

export default function (event) {
  return context => {
    const createActivity = async function (userMission, verb, custom, ...targets) {
      const activity = {
        actor: `user:${userMission.owner}`,
        verb: verb,
        object: `mission:${userMission.mission}`,
        foreignId: `userMission:${userMission.id}`,
        ...custom
      };

      await feeds.addActivity(context.app, activity, targets);
    };

    const performersNotifications = function (userMission) {
      return fp.map(fp.pipe(
        fp.prop('user'),
        fp.toString,
        fp.concat('notification:')
      ), userMission.performers || []);
    };

    const result = helpers.getHookData(context);
    switch (event) {
      case 'mission.create': {
        const notifications = performersNotifications(result);
        const custom = { message: 'Create a mission' };
        createActivity(result, event, custom,
          `user:${result.owner}`,          // add to owner's activity log
          notifications                    // add to all performers' notification stream
        );
        break;
      }
      case 'mission.delete': {
        const notifications = performersNotifications(result);
        const custom = { message: 'Delete the mission' };
        createActivity(result, event, custom,
          `user:${result.owner}`,          // add to owner's activity log
          notifications                    // add to all performers' notification stream
        );
        break;
      }
      case 'mission.join':
        if (result.access === 'public') {
          const player = context.data.player || context.data.user;
          const notifications = performersNotifications(result, player);
          const custom = {
            actor: `user:${player}`,
            message: 'Join the mission',
            role: context.data.roles,
            player: `user:${player}`
          };
          createActivity(result, event, custom,
            `user:${player}`,              // add to player's activity log
            `user:${result.owner}`,        // add to owner's activity log
            `mission:${result.id}`,        // add to mission's activity log
            notifications                  // add to all performers' notification stream
          );
        } else {
          const player = context.data.player || context.data.user;
          const custom = {
            actor: `user:${player}`,
            message: 'Join request the mission',
            role: context.data.roles,
            state: 'pending',
            player: `user:${player}`
          };
          createActivity(result, event + '.request', custom,
            `notification:${result.owner}` // notify owner of the mission to approve requests
          );
        }
        break;
      case 'mission.leave': {
        const player = context.data.user;
        const notifications = performersNotifications(result);
        const custom = {
          actor: `user:${player}`,
          message: 'Leave the mission'
        };
        createActivity(result, event, custom,
          `user:${player}`,                // add to player's activity log
          `mission:${result.id}`,          // add to mission's activity log
          notifications                    // add to all performers' notification stream
        );
        break;
      }
      case 'mission.play': {
        const player = context.data.user;
        const notifications = performersNotifications(result);
        const custom = {
          actor: `user:${player}`,
          message: 'Play a mission trigger',
          task: result.currentTask,
          rewards: result.currentRewards
        };
        createActivity(result, event, custom,
          `user:${player}`,                // add to player's activity log
          `mission:${result.id}`,          // add to mission's activity log
          notifications                    // add to all performers' notification stream
        );
        break;
      }
    }
  };
}
