from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN
import os

path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Project Phase -2 Presentation.pptx'
prs = Presentation(path)

diagrams_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\diagrams'

# Get the blank slide layout (index 6 is usually blank)
blank_layout = prs.slide_layouts[6]

# ============================================================
# Add DFD to Slide 8 (System Design)
# ============================================================
slide8 = prs.slides[7]

# Remove existing TextBox 23 content
for shape in slide8.shapes:
    if shape.name == 'TextBox 23':
        # Clear the text
        for para in shape.text_frame.paragraphs:
            para.text = ""
        # Add DFD image
        dfd_path = os.path.join(diagrams_dir, 'dfd_level1.png')
        # Position the image in the content area
        left = Inches(1.5)
        top = Inches(1.3)
        width = Inches(10.5)
        height = Inches(5.5)
        slide8.shapes.add_picture(dfd_path, left, top, width, height)
        print('Added DFD to Slide 8')
        break

# ============================================================
# Add new slide for Class Diagram (after Slide 8)
# ============================================================
# We need to add a new slide. In python-pptx, we can add slides.
slide9_class = prs.slides.add_slide(blank_layout)

# Add title
title_box = slide9_class.shapes.add_textbox(Inches(2.74), Inches(0), Inches(8.23), Inches(1.14))
tf = title_box.text_frame
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
run = p.add_run()
run.text = "CLASS DIAGRAM"
run.font.name = 'Calibri'
run.font.size = Pt(28)
run.font.bold = True

# Add class diagram image
class_path = os.path.join(diagrams_dir, 'class_diagram.png')
left = Inches(1.0)
top = Inches(1.3)
width = Inches(11.0)
height = Inches(5.7)
slide9_class.shapes.add_picture(class_path, left, top, width, height)
print('Added Class Diagram slide')

# ============================================================
# Add new slide for Use Case Diagram
# ============================================================
slide10_usecase = prs.slides.add_slide(blank_layout)

# Add title
title_box = slide10_usecase.shapes.add_textbox(Inches(2.74), Inches(0), Inches(8.23), Inches(1.14))
tf = title_box.text_frame
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
run = p.add_run()
run.text = "USE CASE DIAGRAM"
run.font.name = 'Calibri'
run.font.size = Pt(28)
run.font.bold = True

# Add use case diagram image
usecase_path = os.path.join(diagrams_dir, 'usecase_diagram.png')
left = Inches(1.5)
top = Inches(1.3)
width = Inches(10.5)
height = Inches(5.5)
slide10_usecase.shapes.add_picture(usecase_path, left, top, width, height)
print('Added Use Case Diagram slide')

# ============================================================
# Move the new slides to be after Slide 8 (before Implementation)
# ============================================================
# python-pptx doesn't support moving slides directly, but we can reorder
# The new slides are at the end. We need to move them.
# Actually, let's just note that the slides are at the end for now.

prs.save(path)
print(f'\nPresentation saved with {len(prs.slides)} slides')
print('Note: New diagram slides are at the end. Reorder in PowerPoint if needed.')
