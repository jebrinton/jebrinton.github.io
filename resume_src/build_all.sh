python resume_src/build.py
cd assets
pdflatex -interaction=nonstopmode resume.tex
pdflatex -interaction=nonstopmode cv.tex
cd ..