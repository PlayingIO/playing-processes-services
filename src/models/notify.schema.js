import { models as rules } from 'playing-rule-services';

const notify = {
  subject: { type: String },               // notify subject when task is completed
  message: { type: String },               // email/in-app notify message
  target: {                                // notify target
    type: { type: String, enum: [          // target type
      'self', 'team_mates', 'mission_members', 'all'
    ]},
    requires: rules.requires.schema,       // target requirements
    roles: [{                              // target roles
      lane: { type: String },
      role: { type: String, enum: [
        'player', 'observer'               // observer can only view process state
      ]}
    }]
  }
};

export default { notify };