import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import EmojiPicker from "components/ads/EmojiPicker";
import MentionsInput from "components/ads/MentionsInput";
import Button, { Category } from "components/ads/Button";

import { BaseEmoji } from "emoji-mart";
import styled from "styled-components";
import { EditorState, convertToRaw, Modifier, SelectionState } from "draft-js";
import { MentionData } from "@draft-js-plugins/mention";

import { OrgUser } from "constants/orgConstants";
import useOrgUsers from "./useOrgUsers";

import { RawDraftContentState } from "draft-js";

import {
  createMessage,
  ADD_COMMENT_PLACEHOLDER,
  CANCEL,
  POST,
} from "constants/messages";

const StyledInputContainer = styled.div`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const StyledEmojiTrigger = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: ${(props) => props.theme.spaces[4]}px;
`;

const PaddingContainer = styled.div<{ removePadding?: boolean }>`
  padding: ${(props) =>
    !props.removePadding
      ? `${props.theme.spaces[7]}px ${props.theme.spaces[5]}px`
      : 0};

  & .cancel-button {
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;

// Trigger tests

const insertCharacter = (
  characterToInsert: string,
  editorState: EditorState,
) => {
  const currentContent = editorState.getCurrentContent(),
    currentSelection = editorState.getSelection();

  const newContent = Modifier.replaceText(
    currentContent,
    currentSelection,
    characterToInsert,
  );

  const newEditorState = EditorState.push(
    editorState,
    newContent,
    "insert-characters",
  );

  return EditorState.forceSelection(
    newEditorState,
    newContent.getSelectionAfter(),
  );
};

// Ref: https://github.com/facebook/draft-js/issues/445#issuecomment-223860229
const resetEditorState = (editorState: EditorState) => {
  let contentState = editorState.getCurrentContent();
  const firstBlock = contentState.getFirstBlock();
  const lastBlock = contentState.getLastBlock();
  const allSelected = new SelectionState({
    anchorKey: firstBlock.getKey(),
    anchorOffset: 0,
    focusKey: lastBlock.getKey(),
    focusOffset: lastBlock.getLength(),
    hasFocus: true,
  });
  contentState = Modifier.removeRange(contentState, allSelected, "backward");
  editorState = EditorState.push(editorState, contentState, "remove-range");
  editorState = EditorState.forceSelection(
    editorState,
    contentState.getSelectionAfter(),
  );

  return editorState;
};

const useUserSuggestions = (
  users: Array<OrgUser>,
  setSuggestions: Dispatch<SetStateAction<Array<MentionData>>>,
) => {
  useEffect(() => {
    setSuggestions(users.map((user) => ({ name: user.username, user })));
  }, [users]);
};

function AddCommentInput({
  initialEditorState,
  onCancel,
  onSave,
  removePadding,
}: {
  removePadding?: boolean;
  initialEditorState?: EditorState;
  onSave: (state: RawDraftContentState) => void;
  onCancel?: () => void;
}) {
  const users = useOrgUsers();
  const [suggestions, setSuggestions] = useState<Array<MentionData>>([]);
  useUserSuggestions(users, setSuggestions);
  const [editorState, setEditorState] = useState(
    initialEditorState || EditorState.createEmpty(),
  );
  const [suggestionsQuery, setSuggestionsQuery] = useState("");

  const clearEditor = useCallback(() => {
    setEditorState(resetEditorState(editorState));
  }, [editorState]);

  const _onCancel = () => {
    clearEditor();
    if (onCancel) onCancel();
  };

  const onSaveComment = useCallback(
    (editorStateArg?: EditorState) => {
      const latestEditorState = editorStateArg || editorState;

      if (!latestEditorState.getCurrentContent().hasText()) return;

      const contentState = latestEditorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      clearEditor();
      onSave(rawContent);
    },
    [editorState],
  );
  const handleSubmit = useCallback(() => onSaveComment(), [editorState]);

  const handleEmojiClick = useCallback(
    (e: React.MouseEvent, emojiObject: BaseEmoji) => {
      const newEditorState = insertCharacter(emojiObject.native, editorState);
      setEditorState(newEditorState);
    },
    [editorState],
  );

  const onSearchChange = useCallback(
    ({ value }: { value: string }) => {
      setSuggestionsQuery(value);
    },
    [suggestions],
  );

  const filteredSuggestions = useMemo(() => {
    if (!suggestionsQuery) return suggestions;
    else {
      return suggestions.filter((suggestion) => {
        const str = suggestion.name.toLowerCase();
        const filter = suggestionsQuery.toLowerCase();
        return str.indexOf(filter) !== -1;
      });
    }
  }, [suggestionsQuery, suggestions]);

  return (
    <PaddingContainer removePadding={removePadding}>
      <Row>
        <StyledInputContainer>
          <MentionsInput
            autoFocus
            editorState={editorState}
            onSearchSuggestions={onSearchChange}
            onSubmit={onSaveComment}
            placeholder={createMessage(ADD_COMMENT_PLACEHOLDER)}
            setEditorState={setEditorState}
            suggestions={filteredSuggestions}
          />
        </StyledInputContainer>
      </Row>
      <Row>
        <StyledEmojiTrigger>
          <EmojiPicker onSelectEmoji={handleEmojiClick} />
        </StyledEmojiTrigger>
        <Row>
          <Button
            category={Category.tertiary}
            className={"cancel-button"}
            onClick={_onCancel}
            text={createMessage(CANCEL)}
            type="button"
          />
          <Button
            category={Category.primary}
            data-cy="add-comment-submit"
            disabled={!editorState.getCurrentContent().hasText()}
            onClick={handleSubmit}
            text={createMessage(POST)}
            type="button"
          />
        </Row>
      </Row>
    </PaddingContainer>
  );
}

export default AddCommentInput;
