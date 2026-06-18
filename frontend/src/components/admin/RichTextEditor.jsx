import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css';

const Font = Quill.import('formats/font');
Font.whitelist = ['arial', 'times-new-roman', 'tahoma', 'courier-new', 'georgia'];
Quill.register(Font, true);

Quill.register({
  'modules/table-better': QuillTableBetter
}, true);

const RichTextEditor = ({ value, onChange, placeholder, className = "" }) => {
  return (
    <>
      <style>
        {`
          /* Font: Arial */
          .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
          .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before {
            content: 'Arial';
            font-family: Arial, Helvetica, sans-serif;
          }
          .ql-font-arial {
            font-family: Arial, Helvetica, sans-serif;
          }

          /* Font: Times New Roman */
          .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before,
          .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before {
            content: 'Times New Roman';
            font-family: 'Times New Roman', Times, serif;
          }
          .ql-font-times-new-roman {
            font-family: 'Times New Roman', Times, serif;
          }

          /* Font: Tahoma */
          .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="tahoma"]::before,
          .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="tahoma"]::before {
            content: 'Tahoma';
            font-family: Tahoma, Geneva, sans-serif;
          }
          .ql-font-tahoma {
            font-family: Tahoma, Geneva, sans-serif;
          }

          /* Font: Courier New */
          .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="courier-new"]::before,
          .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="courier-new"]::before {
            content: 'Courier New';
            font-family: 'Courier New', Courier, monospace;
          }
          .ql-font-courier-new {
            font-family: 'Courier New', Courier, monospace;
          }

          /* Font: Georgia */
          .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="georgia"]::before,
          .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before {
            content: 'Georgia';
            font-family: Georgia, serif;
          }
          .ql-font-georgia {
            font-family: Georgia, serif;
          }
        `}
      </style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={{
          table: false,
          'table-better': {
            language: 'en_US',
            toolbarTable: true,
          },
          keyboard: {
            bindings: {
              ...QuillTableBetter.keyboardBindings
            }
          },
          toolbar: [
            [{ 'font': [false, 'arial', 'times-new-roman', 'tahoma', 'courier-new', 'georgia'] }, { 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image', 'video', 'formula'],
            ['table-better'],
            ['clean']
          ]
        }}
        className={`font-body text-sm border-none ${className}`}
        placeholder={placeholder || 'Bắt đầu soạn thảo...'}
      />
    </>
  );
};

export default RichTextEditor;
