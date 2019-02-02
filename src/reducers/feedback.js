import * as ActionType from '../action/actionType';

const feedback = (state={}, action) => {
    switch (action.type) {
        case ActionType.UPLOAD_FEEDBACK_INFO:
            return {
                ...state,
            }
         default:
            return state;

    }
}

export default feedback;